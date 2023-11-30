import EventEmitter = require("events");
import { feedRequest } from "./feedRequest";
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
  private timer: null | NodeJS.Timer;
  private loadAttempts: number = 0;
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
    this.emit(FeedWatcherEvents.STOP);
  }

  private watch() {
    const fetch = () => {
      this.fetchEntries()
        .then((entries) => {
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
        .catch((err) => this.emit(err));
    };

    return setInterval(() => {
      fetch();
    }, this.interval * 1000);
  }
}
