import { Message } from "discord.js";
import { sendPodcastHelp } from "../../../actions/utility/sendPodcastHelp";
import { parseMessage } from "../../../helpers/parseMessage";
import { FeedListener } from "../../../listeners/feedListener/feedListener";
import { handleEpisodeNumberCommand } from "../actions/handleEpisodeNumberCommand";
import { handleRecentCommand } from "../actions/handleRecentCommand";
import { handleSearchCommand } from "../actions/handleSearchCommand";

export default function handleMessageCreate(
  message: Message,
  feedListener: FeedListener,
  prefix: string
) {
  if (message.author.bot) return;

  if (
    !message.content.startsWith(prefix) ||
    message.content.trim().length === prefix.length
  )
    return;

  const { args, command } = parseMessage(prefix, message);
  const searchString = command + " " + args.join(" ");

  if (!isNaN(Number(command))) {
    handleEpisodeNumberCommand(message, feedListener, command);
  } else if (command === "recent") {
    handleRecentCommand(message, feedListener);
  } else if (command === "help") {
    sendPodcastHelp(message);
  } else {
    handleSearchCommand(message, feedListener, searchString);
  }
}
