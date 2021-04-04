import { Message } from "discord.js";
import { FeedListener } from "../../../feeds/feedListener";

export const handleRecentCommand = (
  message: Message,
  feedListener: FeedListener
) => {
  const episode = feedListener.fetchRecent();
  message.channel.send(episode.url);
};
