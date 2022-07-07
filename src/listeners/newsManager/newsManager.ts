import EventEmitter = require("events");
import { SanityClient } from "@sanity/client";
import { SanityDocument } from "@sanity/types/dist/dts";

import { FeedWatcher } from "../feedListener/feedWatcher";
import { FeedParserEntry, FeedWatcherEvents } from "../feedListener/feedTypes";
import { newsFeedMapper } from "../feedListener/mappers";

import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";
import { shouldFilter } from "./helpers";
import { sub } from "date-fns";

import { sanityClient, sanityImageUrlBuilder } from "../../cms/client";
import { NewsManagerEvents } from "../../types/eventEnums";

const FEED_INTERVAL = 60; // five minutes interval for checking news sources

export interface NewsFeedDocument extends SanityDocument {
  url: string;
  name: string;
  filter?: string;
  thumbnail: string;
  diagnostic: string;
  category: string;
}

export type CmsNewsFeed = {
  data: NewsFeedDocument;
  watcher: any;
};

export class NewsManager extends EventEmitter {
  private feeds: CmsNewsFeed[];
  private cmsClient: SanityClient;
  private entryUrls: { [key: string]: boolean } = {};
  private imageUrlBuilder;

  constructor() {
    super();
    this.feeds = [];
    this.cmsClient = sanityClient;
    this.imageUrlBuilder = sanityImageUrlBuilder;
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

  public initiateWatcher(feed: NewsFeedDocument) {
    return new Promise((resolve, reject) => {
      const thumbnail = feed.thumbnail
        ? this.imageUrlBuilder.image(feed.thumbnail).url()
        : "";
      const formattedFeed = {
        ...feed,
        thumbnail,
      };
      const watcher = this.watcherGenerator(formattedFeed);
      const thresholdDate = sub(new Date(), { days: 3 });

      watcher
        .start()
        .then((entries) => {
          const recentEntries = entries.filter(
            (entry) => entry.pubDate.getTime() > thresholdDate.getTime()
          );
          recentEntries.forEach((entry) => (this.entryUrls[entry.link] = true));
          this.feeds.push({
            data: formattedFeed,
            watcher,
          });
          console.log(`Watching newsFeed ${feed.name}`);
          resolve("Success!");
        })
        .catch((error) => {
          console.error(`Error watching Feed ${feed.name}`, error);
          reject(error);
        });
    });
  }

  public queryCms(query: string) {
    this.cmsClient
      .fetch<NewsFeedDocument[]>(query)
      .then((feeds) => {
        const promises = feeds.map((feed) => this.initiateWatcher(feed));
        return Promise.allSettled(promises);
      })
      .catch((err) => console.error("Unable to fetch Feeds from CMS", err));
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
    this.cmsClient.listen<NewsFeedDocument>(query).subscribe((update) => {
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

    this.queryCms(query);
    this.subscribeToCms(query);
  }

  public notifyNew(data: ContentFeedItem, text?: string) {
    this.emit(NewsManagerEvents.NEW, data, text);
  }
}
