const Watcher = require("feed-watcher");

const DEFAULT_FEED_CHECK_TIME_IN_SECONDS = 60;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_WAIT_TIME_IN_SECONDS = 5;

type RobustWatcherOptions = {
  interval?: number;
  attempts?: number;
  retryTime?: number;
};

export class RobustWatcher extends Watcher {
  private loadAttempts: number = 0;
  private options: RobustWatcherOptions;

  constructor(feedUrl: string, options: RobustWatcherOptions = {}) {
    super(feedUrl, options.interval || DEFAULT_FEED_CHECK_TIME_IN_SECONDS);
    this.options = options;
  }

  public async robustStart() {
    return new Promise<any[]>((resolve, reject) => {
      const starter = (resolver: (value: unknown) => void) => {
        this.loadAttempts++;
        this.start()
          .then((entries: any[]) => {
            resolver(entries);
          })
          .catch((err) => {
            if (
              this.loadAttempts < this.options.attempts ||
              DEFAULT_RETRY_ATTEMPTS
            ) {
              setTimeout(() => {
                starter(resolver);
              }, this.options.retryTime || DEFAULT_RETRY_WAIT_TIME_IN_SECONDS * 1000);
            } else {
              reject(err);
            }
          });
      };

      starter(resolve);
    });
  }
}
