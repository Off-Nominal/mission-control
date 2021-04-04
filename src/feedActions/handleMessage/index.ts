import { Message } from "discord.js";
import { FeedListener } from "../../feeds/feedListener";
import { parseMessage } from "../../helpers/parseMessage";
import { handleRecentCommand } from "./commands/handleRecentCommand";
import { handleSearchCommand } from "./commands/handleSearchCommand";
import { handleEpisodeNumberCommand } from "./commands/handleEpisodeNumberCommand";

export const handleMessage = (
  message: Message,
  feedListener: FeedListener,
  prefix: string
) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const { args, command } = parseMessage(prefix, message);
  const searchString = command + " " + args.join(" ");

  if (!isNaN(Number(command))) {
    handleEpisodeNumberCommand(message, feedListener, command);
  } else if (command === "recent") {
    handleRecentCommand(message, feedListener);
  } else {
    handleSearchCommand(message, feedListener, searchString);
  }
};
