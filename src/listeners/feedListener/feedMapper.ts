import { FeedItem } from "./feedListener";
import { stripHtml } from "string-strip-html";

export const feedMapper = (feedItem): FeedItem => {
  const description = stripHtml(feedItem.description).result;
  return {
    title: feedItem.title,
    date: new Date(feedItem.date),
    url: feedItem.link,
    audioUrl: feedItem.enclosures[0].url,
    image: feedItem.image.url || feedItem.meta.image.url,
    description,
    summary:
      (feedItem["itunes:summary"] && feedItem["itunes:summary"]["#"]) ||
      description.slice(0, 99).concat("..."),
  };
};
