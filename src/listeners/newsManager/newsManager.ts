import EventEmitter = require("events");
const sanityClient = require("@sanity/client");
import { SanityClient } from "@sanity/client";
import { newsFeedMapper } from "../feedListener/mappers";
import { compileExpression } from "filtrex";
import { FeedWatcher } from "../feedListener/feedWatcher";
import { FeedParserEntry } from "../feedListener/feedTypes";

const FEED_INTERVAL = 60; // five minutes interval for checking news sources

const defaultProcessor = (item, title: string) => item;

const getFilterTerms = (filter: string) => {
  const expressionTerms = ["and", "or", "not", "if", "then", "else"];
  const arr = filter.split(" ");
  return arr
    .map((term) => term.replace(/([)(])/g, ""))
    .filter((term) => !expressionTerms.includes(term));
};

export interface CmsResponseData {
  url: string;
  _id: string;
  name: string;
  filter: string;
  thumbnail: string;
}

export type CmsNewsFeed = {
  data: CmsResponseData;
  watcher: any;
};

const shouldFilter = (entry, feed) => {
  if (!feed.filter) {
    return false;
  }

  try {
    const filterExpression = feed.filter;
    const filter = compileExpression(filterExpression);
    const terms = getFilterTerms(filterExpression);
    const regex = new RegExp(`\\b(${terms.join("|")})\\b`, "g");

    const testString =
      entry.title + " " + entry.description + " " + entry.summary;
    const matches = testString.toLowerCase().matchAll(regex);
    const evaluator = new Map(terms.map((term) => [term, false]));

    for (const match of matches) {
      evaluator.set(match[0], true);
    }

    return !filter(Object.fromEntries(evaluator));
  } catch (err) {
    console.error(`Error in filter expression for ${feed.name}`);
    console.error(err);
    return false;
  }
};

export class NewsManager extends EventEmitter {
  private feeds: CmsNewsFeed[];
  private cmsClient: SanityClient;
  private rssEntries: FeedParserEntry[];

  constructor() {
    super();
    this.feeds = [];
    this.cmsClient = sanityClient({
      projectId: process.env.SANITY_CMS_ID,
      dataset: "production" || process.env.NODE_ENV,
      apiVersion: "2022-06-24",
      useCdn: false,
    });
  }

  private watcherGenerator = (feed) => {
    const { url, name, thumbnail } = feed;

    return new FeedWatcher(url, { interval: FEED_INTERVAL })
      .on("new", (entries) => {
        entries.forEach((entry) => {
          if (shouldFilter(entry, feed)) {
            return console.log("Filtered out a value: ", entry.link);
          }

          this.rssEntries.push(entry);

          this.notifyNew(
            newsFeedMapper(entry, name, thumbnail),
            "```json\n" + JSON.stringify(entry).slice(0, 1985) + "\n```"
          );
        });
      })
      .on("error", (error) => {
        console.error(`Error reading news Feed: ${name}`, error);
      });
  };

  public async initiateWatcher(feed) {
    const watcher = this.watcherGenerator(feed);

    try {
      this.rssEntries = await watcher.start();
      this.feeds.push({
        data: feed,
        watcher,
      });
      console.log(`Watching newsFeed ${feed.name}`);
    } catch (error) {
      console.error(`Error watching Feed ${feed.name}`, error);
    }
  }

  public queryCms(query) {
    this.cmsClient
      .fetch<CmsResponseData[]>(query)
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
      '*[_type == "newsFeed"]{name, filter, _id, "thumbnail": thumbnail.asset->url, url}';

    this.queryCms(query);
    this.subscribeToCms(query);
  }

  public notifyNew(data, text) {
    this.emit("newNews", data, text);
  }
}
