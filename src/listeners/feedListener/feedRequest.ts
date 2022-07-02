import { FeedParserEntry } from "./feedTypes";

const FeedParser = require("feedparser");
const https = require("https");
const http = require("http");

export const feedRequest = (url: string): Promise<FeedParserEntry[]> => {
  return new Promise((resolve, reject) => {
    const entries: FeedParserEntry[] = [];
    const options = { feedurl: url };

    const feedParser = new FeedParser([options])
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

    const request = (url: string): Promise<void> => {
      const requester = url.startsWith("https") ? https : http;

      return new Promise((resolve, reject) => {
        const req = requester.get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Bad response from feed ${res.statusCode}`));
          }

          res.pipe(feedParser);
          resolve();
        });

        req.on("error", (err) => {
          reject(err);
        });

        req.end();
      });
    };

    request(url).catch((err) => {
      reject(err);
    });
  });
};
