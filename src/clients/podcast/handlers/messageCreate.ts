import { Message, MessageOptions } from "discord.js";
import { parseMessage } from "../../../helpers/parseMessage";
import { FeedListener } from "../../../listeners/feedListener/feedListener";
import { createPodcastHelpEmbed } from "../../actions/createPodcastHelpEmbed";
import { fetchSearchResults } from "../actions/fetchSearchResults";

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

  let returnMessage: MessageOptions = {
    embeds: [],
  };

  if (!isNaN(Number(command))) {
    returnMessage.content = feedListener.search(command)[0].item.url;
  } else if (command === "recent") {
    returnMessage.content = feedListener.fetchRecent().url;
  } else if (command === "help") {
    returnMessage.embeds.push(createPodcastHelpEmbed());
  } else {
    returnMessage.embeds.push(fetchSearchResults(feedListener, searchString));
  }

  message.channel.send(returnMessage);
}
