import { stripHtml } from "string-strip-html";
import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";

export const youtubeFeedMapper = (
  feedItem,
  showTitle: string
): ContentFeedItem => {
  return {
    author: showTitle,
    title: feedItem.title,
    date: new Date(feedItem.date),
    url: feedItem.link,
    thumbnail: feedItem.image.url,
    summary: feedItem["media:group"]["media:description"]["#"],
    id: feedItem["yt:videoid"]["#"],
    source: showTitle,
  };
};

export const simpleCastFeedMapper = (
  feedItem,
  showTitle: string
): ContentFeedItem => {
  const description = stripHtml(feedItem.description).result;
  return {
    author: feedItem.meta.author,
    title: feedItem.title,
    date: new Date(feedItem.date),
    url: feedItem.link,
    thumbnail: feedItem.image.url || feedItem.meta.image.url,
    description,
    summary:
      (feedItem["itunes:summary"] && feedItem["itunes:summary"]["#"]) ||
      description.slice(0, 99).concat("..."),
    source: showTitle,
  };
};

export const newsFeedMapper = (
  feedItem,
  feedTitle: string,
  feedThumbnail: string = ""
): ContentFeedItem => {
  return {
    author: feedItem.author,
    title: feedItem.title,
    date: new Date(feedItem.date),
    url: feedItem.link,
    thumbnail: feedThumbnail,
    description: stripHtml(feedItem.description).result,
    summary: stripHtml(feedItem.summary).result,
    source: feedTitle,
  };
};

const mappers = {
  simpleCastFeedMapper,
  youtubeFeedMapper,
};

export default mappers;
