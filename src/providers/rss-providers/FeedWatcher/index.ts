import EventEmitter = require("events");
import { feedRequest } from "./feedRequest";
import {
  formatFeedError,
  isPermanentRequestFailure,
  nextFeedPoll,
} from "./errors";
import { FeedParserEntry, FeedWatcherEvents } from "./types";
export * from "./types";
export * from "./mappers";

const DEFAULT_FEED_CHECK_TIME_IN_SECONDS = 60;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_WAIT_TIME_IN_SECONDS = 5;

type RobustWatcherOptions = {
  interval?: number;
  attempts?: number;
  retryTime?: number;
};

export class FeedWatcher extends EventEmitter {
  private feedurl: string;
  private interval: number;
  private timer: ReturnType<typeof setInterval> | null;
  private loadAttempts: number = 0;
  private consecutivePermanentFailures: number = 0;
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
    return feedRequest(this.feedurl);
  }

  public start(): Promise<FeedParserEntry[]> {
    const attempts = this.options.attempts || DEFAULT_RETRY_ATTEMPTS;
    const retryTime =
      (this.options.retryTime || DEFAULT_RETRY_WAIT_TIME_IN_SECONDS) * 1000;

    return new Promise((resolve, reject) => {
      const fetcher = (resolver) => {
        this.loadAttempts++;
        this.fetchEntries()
          .then((entries) => {
            this.lastEntry.date = entries[0].pubDate;
            this.lastEntry.permalink = entries[0].link;
            this.timer = this.watch();
            resolver(entries);
          })
          .catch((err) => {
            const gaveUp =
              isPermanentRequestFailure(err) || attempts <= this.loadAttempts;

            if (gaveUp) {
              const attemptLabel =
                this.loadAttempts === 1
                  ? "1 time"
                  : `${this.loadAttempts} times`;
              console.error(
                `Tried loading ${this.feedurl} ${attemptLabel}: ${formatFeedError(err)}`
              );
              return reject(err);
            }

            setTimeout(() => {
              fetcher(resolver);
            }, retryTime);
          });
      };
      fetcher(resolve);
    });
  }

  public stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit(FeedWatcherEvents.STOP);
  }

  private watch() {
    const fetch = () => {
      this.fetchEntries()
        .then((entries) => {
          this.consecutivePermanentFailures = 0;
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
        })
        .catch((err) => {
          const decision = nextFeedPoll(
            this.consecutivePermanentFailures,
            err,
          );
          this.consecutivePermanentFailures = decision.consecutivePermanent;
          this.emit(FeedWatcherEvents.ERROR, err);
          if (!decision.stop) return;

          console.error(
            `Stopped checking ${this.feedurl} after ${decision.consecutivePermanent} permanent failures: ${formatFeedError(err)}`,
          );
          this.stop();
        });
    };

    return setInterval(() => {
      fetch();
    }, this.interval * 1000);
  }
}
