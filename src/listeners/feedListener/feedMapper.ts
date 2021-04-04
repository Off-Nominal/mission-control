import { FeedItem } from "./feedListener";
import { stripHtml } from "string-strip-html";

export const feedMapper = (feedItem): FeedItem => {
  return {
    title: feedItem.title,
    date: feedItem.date,
    url: feedItem.link,
    audioUrl: feedItem.enclosures[0].url,
    image: feedItem.image.url,
    description: stripHtml(feedItem.description).result,
  };
};
