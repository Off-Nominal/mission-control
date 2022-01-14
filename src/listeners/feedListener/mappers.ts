import { stripHtml } from "string-strip-html";
import { FeedItem } from "./feedListener";

export const youtubeFeedMapper = (feedItem, showTitle: string): FeedItem => {
  return {
    show: showTitle,
    title: feedItem.title,
    date: new Date(feedItem.date),
    url: feedItem.link,
    image: feedItem.image.url,
    summary: feedItem["media:group"]["media:description"]["#"],
    id: feedItem["yt:videoid"]["#"],
  };
};

export const simpleCastFeedMapper = (feedItem, showTitle: string): FeedItem => {
  const description = stripHtml(feedItem.description).result;
  return {
    show: showTitle,
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

const mappers = {
  simpleCastFeedMapper,
  youtubeFeedMapper,
};

export default mappers;
