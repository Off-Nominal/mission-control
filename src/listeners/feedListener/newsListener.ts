import EventEmitter = require("events");
const Watcher = require("feed-watcher");
const sanityClient = require("@sanity/client");
import { SanityClient } from "@sanity/client";
import { RobustWatcher } from "./RobustWatcher";

const FEED_INTERVAL = 60; // five minutes interval for checking news sources

const defaultProcessor = (item, title: string) => item;

export interface CmsResponseData {
  url: string;
  _id: string;
  name: string;
  thumbnail: string;
}

export type CmsNewsFeed = {
  data: CmsResponseData;
  watcher: any;
};

export class NewsListener extends EventEmitter {
  private feeds: CmsNewsFeed[];
  private cmsClient: SanityClient;

  constructor() {
    super();
    this.feeds = [];
    this.cmsClient = sanityClient({
      projectId: process.env.SANITY_CMS_ID,
      dataset: process.env.NODE_ENV,
      apiVersion: "2022-06-24",
      useCdn: true,
    });
  }

  public initiateWatcher(feed) {
    const watcher = new RobustWatcher(feed.url, { interval: FEED_INTERVAL });
    watcher.on("new entries", (entries) => {
      entries.forEach((entry) => {
        this.notifyNew({
          rssEntry: entry,
          feed,
        });
      });
    });
    watcher.on("error", (error) => {
      console.error(`Error reading news Feed: ${feed.name}`, error);
    });
    watcher
      .robustStart()
      .then(() => {
        this.feeds.push({
          data: feed,
          watcher,
        });
        console.log(`Watching newsFeed ${feed.name}`);
      })
      .catch((error) =>
        console.error(`Error watching Feed ${feed.name}`, error)
      );
  }

  public queryCms(query) {
    this.cmsClient
      .fetch(query)
      .then((response) => {
        response.forEach((feed) => this.initiateWatcher(feed));
      })
      .catch((err) => console.error("Unable to fetch Feeds from CMS", err));
  }

  public subscribeToCms(query) {
    this.cmsClient.listen(query).subscribe((update) => {
      update.mutations.forEach((mutation) => {
        if ("create" in mutation) {
          this.initiateWatcher(update.result);
        }

        if ("delete" in mutation) {
          const deletedFeedIndex = this.feeds.findIndex(
            (feed) =>
              "id" in mutation.delete && feed.data._id === mutation.delete.id
          );

          if (deletedFeedIndex < 0) {
            return;
          }

          const feed = this.feeds[deletedFeedIndex];
          feed.watcher.stop();
          console.log(`Stopped monitoring ${feed.data.name}`);
          this.feeds.splice(deletedFeedIndex, 1);
        }
      });
    });
  }

  public initialize() {
    const query =
      '*[_type == "newsFeed"]{name, _id, "thumbnail": thumbnail.asset->url, url}';

    this.queryCms(query);
    this.subscribeToCms(query);
  }

  public notifyNew(newsItem) {
    this.emit("newNews", newsItem);
  }
}
