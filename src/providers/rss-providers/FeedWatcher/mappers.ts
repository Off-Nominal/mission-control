import { stripHtml } from "string-strip-html";
import { ContentFeedItem } from "../../../actions/post-to-content-channel";
import { FeedParserEntry } from "./types";

export const youtubeFeedMapper = (
  feedItem: FeedParserEntry,
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
  feedItem: FeedParserEntry,
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
    summary: feedItem["itunes:summary"] && feedItem["itunes:summary"]["#"],
    source: showTitle,
  };
};

export const newsFeedMapper = (
  feedItem: FeedParserEntry,
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
