import EventEmitter = require("events");
import { feedRequest } from "./feedRequest";
import { formatFeedError, formatFeedWait, nextFeedPoll } from "./errors";
import { FeedParserEntry, FeedWatcherEvents } from "./types";
export * from "./types";
export * from "./mappers";

const DEFAULT_FEED_CHECK_TIME_IN_SECONDS = 60;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_WAIT_TIME_IN_SECONDS = 5;

export type FeedFetcher = () => Promise<FeedParserEntry[]>;

type RobustWatcherOptions = {
  interval?: number;
  attempts?: number;
  retryTime?: number;
  // After the startup attempts are spent, keep polling instead of stopping.
  pollAfterFailedStart?: boolean;
  fetch?: FeedFetcher;
};

export class FeedWatcher extends EventEmitter {
  protected feedurl: string;
  private interval: number;
  private timer: ReturnType<typeof setTimeout> | null;
  private repeating = false;
  private loadAttempts: number = 0;
  private consecutivePermanentFailures: number = 0;
  private backoffStep: number = 0;
  private baselineSet = false;
  protected recoveryPolling = false;
  private options: RobustWatcherOptions;
  private lastEntry: {
    date?: Date;
    permalink?: string;
  };

  constructor(feedurl: string, options: RobustWatcherOptions = {}) {
    super();

    if (!feedurl || typeof feedurl !== "string") {
      throw new Error("Feed url must be defined.");
    }

    this.feedurl = feedurl;
    this.interval = options.interval || DEFAULT_FEED_CHECK_TIME_IN_SECONDS;
    this.options = options;
    this.timer = null;
    this.lastEntry = {};
  }

  private fetchEntries() {
    if (this.options.fetch) return this.options.fetch();
    return feedRequest(this.feedurl);
  }

  private rememberLatest(entries: FeedParserEntry[]) {
    this.lastEntry.date = entries[0].pubDate;
    this.lastEntry.permalink = entries[0].link;
    this.baselineSet = true;
  }

  public start(): Promise<FeedParserEntry[]> {
    const attempts = this.options.attempts || DEFAULT_RETRY_ATTEMPTS;
    // 0 is a real wait. `||` would replace it with the default.
    const retryTime =
      (this.options.retryTime ?? DEFAULT_RETRY_WAIT_TIME_IN_SECONDS) * 1000;

    this.loadAttempts = 0;
    this.clearTimer();
    this.recoveryPolling = false;

    return new Promise((resolve, reject) => {
      const fetcher = () => {
        this.loadAttempts++;
        this.fetchEntries()
          .then((entries) => {
            this.rememberLatest(entries);
            this.consecutivePermanentFailures = 0;
            this.backoffStep = 0;
            this.watch();
            resolve(entries);
          })
          .catch((err) => {
            const decision = nextFeedPoll(
              {
                consecutivePermanent: this.consecutivePermanentFailures,
                backoffStep: this.backoffStep,
              },
              err,
            );
            this.consecutivePermanentFailures = decision.consecutivePermanent;
            this.backoffStep = decision.backoffStep;

            // HTTP 4xx used to stop on the first response. Give every error
            // the same attempt budget, then keep checking when asked.
            if (this.loadAttempts < attempts) {
              setTimeout(fetcher, retryTime);
              return;
            }

            const attemptLabel =
              this.loadAttempts === 1
                ? "1 time"
                : `${this.loadAttempts} times`;
            console.error(
              `Tried loading ${this.feedurl} ${attemptLabel}: ${formatFeedError(err)}`,
            );

            if (this.options.pollAfterFailedStart) {
              this.recoveryPolling = true;
              this.armFailurePoll(decision.delayMs, err);
            }
            reject(err);
          });
      };
      fetcher();
    });
  }

  public stop() {
    this.clearTimer();
    this.emit(FeedWatcherEvents.STOP);
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  protected arm(delayMs: number, repeating: boolean) {
    this.clearTimer();
    this.repeating = repeating;
    const run = () => this.poll();
    this.timer = repeating ? setInterval(run, delayMs) : setTimeout(run, delayMs);
  }

  private watch() {
    this.arm(this.interval * 1000, true);
  }

  private armFailurePoll(delayMs: number | null, err: unknown) {
    if (delayMs != null) {
      console.error(
        `Waiting ${formatFeedWait(delayMs)} before checking ${this.feedurl} again: ${formatFeedError(err)}`,
      );
      this.arm(delayMs, false);
      return;
    }
    this.arm(this.interval * 1000, true);
  }

  protected poll(): Promise<void> {
    return this.fetchEntries()
      .then((entries) => {
        const leftBackoff = this.backoffStep > 0;
        this.consecutivePermanentFailures = 0;
        this.backoffStep = 0;

        if (!this.baselineSet) {
          this.rememberLatest(entries);
          this.emit(FeedWatcherEvents.INITIAL, entries);
          if (leftBackoff || !this.repeating) {
            console.log(`Resumed checking ${this.feedurl}`);
            this.arm(this.interval * 1000, true);
          }
          return;
        }

        const newEntries = entries.filter(
          (entry) =>
            entry.pubDate > this.lastEntry.date &&
            entry.link !== this.lastEntry.permalink
        );

        if (newEntries.length > 0) {
          this.lastEntry.date = newEntries[0].pubDate;
          this.lastEntry.permalink = newEntries[0].link;
          this.emit(FeedWatcherEvents.NEW, newEntries);
        }

        if (leftBackoff) {
          console.log(`Resumed checking ${this.feedurl}`);
          this.arm(this.interval * 1000, true);
        }
      })
      .catch((err) => {
        const decision = nextFeedPoll(
          {
            consecutivePermanent: this.consecutivePermanentFailures,
            backoffStep: this.backoffStep,
          },
          err,
        );
        this.consecutivePermanentFailures = decision.consecutivePermanent;
        this.backoffStep = decision.backoffStep;
        this.emit(FeedWatcherEvents.ERROR, err);
        if (decision.delayMs != null) {
          console.error(
            `Waiting ${formatFeedWait(decision.delayMs)} before checking ${this.feedurl} again: ${formatFeedError(err)}`,
          );
          this.arm(decision.delayMs, false);
          return;
        }
        if (!this.repeating) {
          this.arm(this.interval * 1000, true);
        }
      });
  }
}
