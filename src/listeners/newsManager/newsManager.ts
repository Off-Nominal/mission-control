import EventEmitter = require("events");

const sanityClient = require("@sanity/client");
const imageUrlBuilder = require("@sanity/image-url");
import { SanityClient } from "@sanity/client";
import { SanityDocument } from "@sanity/types/dist/dts";

import { FeedWatcher } from "../feedListener/feedWatcher";
import { FeedParserEntry } from "../feedListener/feedTypes";
import { newsFeedMapper } from "../feedListener/mappers";

import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";
import { shouldFilter } from "./helpers";

const FEED_INTERVAL = 60; // five minutes interval for checking news sources

export interface NewsFeedDocument extends SanityDocument {
  url: string;
  name: string;
  filter?: string;
  thumbnail: string;
  diagnostic: string;
}

export type CmsNewsFeed = {
  data: NewsFeedDocument;
  watcher: any;
};

export class NewsManager extends EventEmitter {
  private feeds: CmsNewsFeed[];
  private cmsClient: SanityClient;
  private rssEntries: FeedParserEntry[];
  private imageUrlBuilder;

  constructor() {
    super();
    this.feeds = [];
    this.cmsClient = sanityClient({
      projectId: process.env.SANITY_CMS_ID,
      dataset:
        process.env.SANITY_DATASET || process.env.NODE_ENV || "development",
      apiVersion: "2022-06-24",
      useCdn: process.env.SANITY_CDN || true,
    });
    this.imageUrlBuilder = imageUrlBuilder(this.cmsClient);
  }

  private watcherGenerator = (feed: NewsFeedDocument) => {
    const { url, name, thumbnail, diagnostic } = feed;

    return new FeedWatcher(url, { interval: FEED_INTERVAL })
      .on("new", (entries: FeedParserEntry[]) => {
        entries.forEach((entry) => {
          if (shouldFilter(entry, feed)) {
            return console.log("Filtered out a value: ", entry.link);
          }

          this.rssEntries.push(entry);
          diagnostic && console.log(entry);
          this.notifyNew(newsFeedMapper(entry, name, thumbnail));
        });
      })
      .on("error", (error) => {
        console.error(`Error reading news Feed: ${name}`, error);
      });
  };

  public async initiateWatcher(feed: NewsFeedDocument) {
    const thumbnail = this.imageUrlBuilder.image(feed.thumbnail).url();
    const formattedFeed = {
      ...feed,
      thumbnail,
    };
    const watcher = this.watcherGenerator(formattedFeed);

    try {
      this.rssEntries = await watcher.start();
      this.feeds.push({
        data: formattedFeed,
        watcher,
      });
      console.log(`Watching newsFeed ${feed.name}`);
    } catch (error) {
      console.error(`Error watching Feed ${feed.name}`, error);
    }
  }

  public queryCms(query: string) {
    this.cmsClient
      .fetch<NewsFeedDocument[]>(query)
      .then((response) => {
        response.forEach((feed) => this.initiateWatcher(feed));
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
    this.emit("newNews", data, text);
  }
}
