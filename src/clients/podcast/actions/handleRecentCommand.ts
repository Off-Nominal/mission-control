import { Message } from "discord.js";
import { FeedListener } from "../../../listeners/feedListener/feedListener";

export const handleRecentCommand = (
  message: Message,
  feedListener: FeedListener
) => {
  const episode = feedListener.fetchRecent();
  message.channel.send({ content: episode.url });
};
