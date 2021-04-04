import { Message } from "discord.js";
import { handleEpisodeNumberCommand } from "../../../actions/feedListener/handleEpisodeNumberCommand";
import { handleRecentCommand } from "../../../actions/feedListener/handleRecentCommand";
import { handleSearchCommand } from "../../../actions/feedListener/handleSearchCommand";
import { parseMessage } from "../../../helpers/parseMessage";
import { FeedListener } from "../../../listeners/feedListener/feedListener";

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

export default handleMessage;
