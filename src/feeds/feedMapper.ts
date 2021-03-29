import { FeedItem } from "./feedListener";

export const feedMapper = (feedItem): FeedItem => {
  return {
    title: feedItem.title,
    date: feedItem.date,
    url: feedItem.link,
    audioUrl: feedItem.enclosures[0].url,
    image: feedItem.image.url,
  };
};
