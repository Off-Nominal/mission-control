import EventEmitter = require("events");
import { feedRequest } from "./feedRequest";
import { FeedParserEntry } from "./feedTypes";

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
  private timer: null | NodeJS.Timer;
  private loadAttempts: number = 0;
  private options: RobustWatcherOptions;
  private lastEntryDate: Date;

  constructor(feedurl: string, options: RobustWatcherOptions = {}) {
    super();

    if (!feedurl || typeof feedurl !== "string") {
      throw new Error("Feed url must be defined.");
    }

    this.feedurl = feedurl;
    this.interval = options.interval || DEFAULT_FEED_CHECK_TIME_IN_SECONDS;
    this.options = options;
    this.timer = null;
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
            this.lastEntryDate = entries[0].pubDate;
            this.timer = this.watch();
            resolver(entries);
          })
          .catch((err) => {
            if (attempts <= this.loadAttempts) {
              console.error(`Tried loading ${this.feedurl} ${attempts} times`);
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
    clearInterval(this.timer);
    this.emit("stop");
  }

  private watch() {
    const fetch = () => {
      this.fetchEntries()
        .then((entries) => {
          const newEntries = entries.filter(
            (entry) => entry.pubDate > this.lastEntryDate
          );

          if (newEntries.length > 0) {
            this.lastEntryDate = newEntries[0].pubDate;
            this.emit("new", newEntries);
          }
        })
        .catch((err) => this.emit(err));
    };

    return setInterval(() => {
      fetch();
    }, this.interval * 1000);
  }
}
