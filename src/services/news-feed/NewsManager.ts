import EventEmitter = require("events");

import {
  FeedWatcher,
  newsFeedMapper,
  FeedParserEntry,
  FeedWatcherEvents,
} from "../../utilities/FeedWatcher";
import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";
import { shouldFilter } from "./helpers";
import { sub } from "date-fns";

import {
  NewsFeedDocument,
  sanityClient,
  sanityImageUrlBuilder,
} from "../../providers/sanity";
import { NewsManagerEvents } from "../../types/eventEnums";
import { isFulfilled } from "../../helpers/allSettledTypeGuard";

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
        console.error(`Error reading news Feed: ${name}`, error);
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
        console.error(error);
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

  public subscribeToCms(query: string) {
    sanityClient.listen<NewsFeedDocument>(query).subscribe((update) => {
      update.mutations.forEach((mutation) => {
        const id = update.documentId;

        if ("createOrReplace" in mutation) {
          this.deleteFeed(id);
          this.initiateWatcher(update.result);
        }
        if ("create" in mutation) {
          this.initiateWatcher(update.result);
        }
        if ("delete" in mutation) {
          this.deleteFeed(id);
        }
      });
    });
  }

  public initialize() {
    const query =
      '*[_type == "newsFeed"]{name, filter, _id, diagnostic, thumbnail, url}';

    const queryResult = this.queryCms(query);
    this.subscribeToCms(query);
    queryResult.then((promises) => {
      for (const promise of promises) {
        if (promise.status === "rejected") {
          this.emit(
            NewsManagerEvents.ERROR,
            `Error subscribing to ${promise.reason}.`
          );
        }
      }

      const totalSubs = promises.length;
      const successfulSubs = promises.filter(isFulfilled).length;
      if (successfulSubs > 0) {
        this.emit(
          NewsManagerEvents.READY,
          `Successfully subscribed to ${successfulSubs}/${totalSubs} news feeds.`
        );
      } else {
        this.emit(
          NewsManagerEvents.ERROR,
          `Failure to subscribe to any News Feeds.`
        );
      }
    });
  }

  public notifyNew(data: ContentFeedItem, text?: string) {
    this.emit(NewsManagerEvents.NEW, data, text);
  }
}
