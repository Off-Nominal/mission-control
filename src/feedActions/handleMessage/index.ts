import { Message } from "discord.js";
import { FeedListener } from "../../feeds/feedListener";
import { parseMessage } from "../../helpers/parseMessage";
import { handleRecentCommand } from "./commands/handleRecentCommand";

export const handleMessage = (
  message: Message,
  feedListener: FeedListener,
  prefix: string
) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const { args, command } = parseMessage(prefix, message);

  if (command === "recent") {
    handleRecentCommand(message, feedListener);
  }
};
