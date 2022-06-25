import EventEmitter = require("events");
const Watcher = require("feed-watcher");
const sanityClient = require("@sanity/client");
import { SanityClient } from "@sanity/client";
import { Mutation } from "@sanity/types/dist/dts";

const FEED_INTERVAL = 60; // five minutes interval for checking news sources

interface Feed {
  data: {
    url: string;
    _id: string;
    name: string;
  };
  watcher: any;
}

export class NewsListener extends EventEmitter {
  private feeds: Feed[];
  private cmsClient: SanityClient;

  constructor() {
    super();
    this.feeds = [];
    this.cmsClient = sanityClient({
      projectId: process.env.SANITY_CMS_ID,
      dataset: process.env.NODE_ENV,
      apiVersion: "2022-06-24",
      useCdn: false,
    });
  }

  public initiateWatcher(feed) {
    const watcher = new Watcher(feed.url, FEED_INTERVAL);
    watcher.on("new entries", (entries) => {
      entries.forEach((entry) => {
        this.notifyNew(entry);
      });
    });
    watcher.on("error", (error) => {
      console.error(`Error reading news Feed: ${feed.name}`, error);
    });
    watcher
      .start()
      .then((entries) => {
        console.log(`Watching newsFeed ${feed.name}`);
      })
      .catch((error) => console.error(error));
    this.feeds.push({
      data: feed,
      watcher,
    });
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
    const query = '*[_type == "newsFeed"]';

    this.queryCms(query);
    this.subscribeToCms(query);
  }

  public notifyNew(newsItem) {
    console.log("newNews", newsItem);
    this.emit("newNews", newsItem);
  }
}
