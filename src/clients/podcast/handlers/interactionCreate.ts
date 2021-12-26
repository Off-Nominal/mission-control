import { Interaction, MessageOptions } from "discord.js";
import { FeedListener } from "../../../listeners/feedListener/feedListener";
import { fetchSearchResults } from "../actions/fetchSearchResults";

export default function handleInteractionCreate(
  interaction: Interaction,
  feedListener: FeedListener
) {
  if (!interaction.isCommand()) return;

  const { options } = interaction;

  const subCommand = options.getSubcommand();
  const searchString = options.getString("search-term", false);
  const episodeNumber = options.getInteger("ep-number", false);

  let returnMessage: MessageOptions = {
    embeds: [],
  };

  if (subCommand === "search") {
    returnMessage.embeds.push(fetchSearchResults(feedListener, searchString));
  }

  if (subCommand === "recent") {
    returnMessage.content = feedListener.fetchRecent().url;
  }

  if (subCommand === "episode-number") {
    returnMessage.content = feedListener.getEpisodeByNumber(episodeNumber).url;
  }

  interaction.reply(returnMessage);
}
