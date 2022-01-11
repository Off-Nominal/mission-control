import { Interaction, MessageOptions } from "discord.js";
import { FeedListener } from "../../../listeners/feedListener/feedListener";
import { createPodcastHelpEmbed } from "../actions/createPodcastHelpEmbed";
import { fetchSearchResults } from "../actions/fetchSearchResults";

export default function handleInteractionCreate(
  interaction: Interaction,
  listeners: {
    wm: FeedListener;
    meco: FeedListener;
    ofn: FeedListener;
    rpr: FeedListener;
    hl: FeedListener;
  }
) {
  if (!interaction.isCommand()) return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === "help") {
    return interaction.reply({ embeds: [createPodcastHelpEmbed()] });
  }

  const show = options.getString("show", true);
  const type = options.getString("type", true);
  const term = options.getString("term", true);

  const feedListener = listeners[show];

  let returnMessage: MessageOptions = {
    embeds: [],
  };

  if (type === "search") {
    returnMessage.embeds.push(fetchSearchResults(feedListener, term));
  }

  if (type === "recent") {
    returnMessage.content = feedListener.fetchRecent().url;
  }

  if (type === "episode") {
    returnMessage.content = feedListener.getEpisodeByNumber(Number(term)).url;
  }

  interaction.reply(returnMessage);
}
