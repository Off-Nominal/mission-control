import { FeedParserEntry } from "./feedTypes";
import axios from "axios";

const FeedParser = require("feedparser");

enum FeedParserEvents {
  ERROR = "error",
  READABLE = "readable",
  END = "end",
}

export const feedRequest = (feedUrl: string): Promise<FeedParserEntry[]> => {
  return new Promise((resolve, reject) => {
    const entries: FeedParserEntry[] = [];
    // const options = { feedurl: url };

    const feedParser = new FeedParser()
      .on(FeedParserEvents.ERROR, (err) => console.error(err))
      .on(FeedParserEvents.READABLE, () => {
        let item: FeedParserEntry;
        while ((item = feedParser.read())) {
          entries.push(item);
        }
      })
      .on(FeedParserEvents.END, () => {
        if (!entries.length) {
          reject(new Error("No entries in the feed"));
        }
        resolve(
          entries.sort((a, b) => {
            if (!a.pubDate || !b.pubDate) return 0;

            return b.pubDate.getTime() - a.pubDate.getTime();
          })
        );
      });

    axios
      .get(feedUrl, {
        responseType: "stream",
        headers: {
          Accept:
            "application/rss+xml, application/rdf+xml;q=0.8, application/atom+xml;q=0.6, application/xml;q=0.4, text/xml;q=0.4",
        },
      })
      .then(({ data }) => data.pipe(feedParser))
      .catch((err) => reject(err));
  });
};
