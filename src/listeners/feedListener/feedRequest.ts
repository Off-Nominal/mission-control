import { FeedParserEntry } from "./feedTypes";
import axios from "axios";

const FeedParser = require("feedparser");

export const feedRequest = (feedUrl: string): Promise<FeedParserEntry[]> => {
  return new Promise((resolve, reject) => {
    const entries: FeedParserEntry[] = [];
    // const options = { feedurl: url };

    const feedParser = new FeedParser()
      .on("error", (err) => console.error(err))
      .on("readable", () => {
        let item: FeedParserEntry;
        while ((item = feedParser.read())) {
          entries.push(item);
        }
      })
      .on("end", () => {
        if (!entries.length) {
          reject(new Error("No entries in the feed"));
        }
        resolve(entries);
      });

    axios
      .get(feedUrl, { responseType: "stream" })
      .then((response) => {
        response.data.pipe(feedParser);
      })
      .catch((err) => reject(err));
  });
};
