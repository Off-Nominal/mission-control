import EventEmitter = require("events");

import {
  FeedWatcher,
  newsFeedMapper,
  FeedParserEntry,
  FeedWatcherEvents,
} from "../FeedWatcher";
import { ContentFeedItem } from "../../../actions/post-to-content-channel";
import { shouldFilter } from "./helpers";
import { sub } from "date-fns";

import {
  NewsFeedDocument,
  sanityClient,
  sanityImageUrlBuilder,
} from "../../sanity";
import { formatFeedError } from "../FeedWatcher/errors";
import {
  emitSubscriptionReport,
  NewsManagerEvents,
} from "./reportSubscriptionResults";

export { NewsManagerEvents };

const FEED_INTERVAL = 60; // five minutes interval for checking news sources

export type CmsNewsFeed = {
  data: NewsFeedDocument;
  watcher: any;
};

export class NewsManager extends EventEmitter {
  private feeds: CmsNewsFeed[];
  private entryUrls: { [key: string]: boolean } = {};

  constructor() {
    super();
    this.feeds = [];
  }

  private watcherGenerator = (feed: NewsFeedDocument) => {
    const { url, name, thumbnail, diagnostic } = feed;

    return new FeedWatcher(url, { interval: FEED_INTERVAL })
      .on(FeedWatcherEvents.NEW, (entries: FeedParserEntry[]) => {
        entries.forEach((entry) => {
          if (shouldFilter(entry, feed)) {
            return console.log("Filtered out a value: ", entry.link);
          }

          if (this.entryUrls[entry.link]) {
            return console.log("Duplicate story: ", entry.link);
          }

          this.entryUrls[entry.link] = true;
          diagnostic && console.log(entry);
          this.notifyNew(newsFeedMapper(entry, name, thumbnail));
        });
      })
      .on(FeedWatcherEvents.ERROR, (error) => {
        console.error(
          `Error reading news Feed: ${name}: ${formatFeedError(error)}`
        );
      });
  };

  public initiateWatcher(feed: NewsFeedDocument): Promise<string> {
    const thumbnail = feed.thumbnail
      ? sanityImageUrlBuilder.image(feed.thumbnail).url()
      : "";
    const formattedFeed = {
      ...feed,
      thumbnail,
    };
    const watcher = this.watcherGenerator(formattedFeed);
    const thresholdDate = sub(new Date(), { days: 3 });

    return watcher
      .start()
      .then((entries) => {
        const recentEntries = entries.filter((entry) => {
          if (!entry.pubDate) return false;
          return entry.pubDate.getTime() > thresholdDate.getTime();
        });
        recentEntries.forEach((entry) => (this.entryUrls[entry.link] = true));
        this.feeds.push({
          data: formattedFeed,
          watcher,
        });
        return feed.name;
      })
      .catch((error) => {
        console.error(
          `Error subscribing to ${feed.name}: ${formatFeedError(error)}`
        );
        throw feed.name;
      });
  }

  public queryCms(query: string) {
    return sanityClient.fetch<NewsFeedDocument[]>(query).then((feeds) => {
      const promises = feeds.map((feed) => this.initiateWatcher(feed));
      return Promise.allSettled(promises);
    });
  }

  private fetchFeedIndex(id: string) {
    return this.feeds.findIndex((feed) => feed.data._id === id);
  }

  private deleteFeed(id: string) {
    const feedIndex = this.fetchFeedIndex(id);

    if (feedIndex < 0) {
      return;
    }

    const feed = this.feeds[feedIndex];
    feed.watcher.stop();
    this.feeds.splice(feedIndex, 1);
    console.log(`Stopped monitoring ${feed.data.name}`);
  }

  private trackFeed(feed: NewsFeedDocument) {
    void Promise.resolve()
      .then(() => {
        if (!feed?.url) {
          throw new Error("News feed is missing a url.");
        }
        return this.initiateWatcher(feed);
      })
      .catch((reason) => {
        // initiateWatcher already logged the feed name and rejected with it.
        if (typeof reason === "string") {
          return;
        }
        console.error(
          `Error subscribing to ${feed?.name ?? "news feed"}: ${formatFeedError(reason)}`
        );
      });
  }

  public subscribeToCms(query: string) {
    sanityClient.listen<NewsFeedDocument>(query).subscribe((update) => {
      update.mutations.forEach((mutation) => {
        const id = update.documentId;

        if ("createOrReplace" in mutation) {
          this.deleteFeed(id);
          this.trackFeed(update.result);
        }
        if ("create" in mutation) {
          this.trackFeed(update.result);
        }
        if ("delete" in mutation) {
          this.deleteFeed(id);
        }
      });
    });
  }

  private publishSubscriptionReport(
    results: PromiseSettledResult<string>[]
  ) {
    emitSubscriptionReport((event, message) => {
      if (event === NewsManagerEvents.ERROR) {
        console.error(message);
      }
      this.emit(event, message);
    }, results);
  }

  public initialize(): Promise<void> {
    const query =
      '*[_type == "newsFeed"]{name, filter, _id, diagnostic, thumbnail, url}';

    this.subscribeToCms(query);
    return this.queryCms(query)
      .then((results) => {
        this.publishSubscriptionReport(results);
        const successful = results.filter(
          (result) => result.status === "fulfilled",
        ).length;
        if (successful === 0) {
          throw new Error("Failure to subscribe to any News Feeds.");
        }
      })
      .catch((error) => {
        if (
          error instanceof Error &&
          error.message === "Failure to subscribe to any News Feeds."
        ) {
          throw error;
        }
        const message = `Failure to subscribe to any News Feeds: ${formatFeedError(error)}`;
        console.error(message);
        this.emit(NewsManagerEvents.ERROR, message);
        throw error;
      });
  }

  public notifyNew(data: ContentFeedItem, text?: string) {
    this.emit(NewsManagerEvents.NEW, data, text);
  }
}
