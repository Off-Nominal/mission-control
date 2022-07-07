import { Interaction, MessageOptions } from "discord.js";
import { ContentListener } from "../../../listeners/contentListener/contentListener";
import { ContentBotEvents } from "../../types";
import { createPodcastHelpEmbed } from "../actions/createPodcastHelpEmbed";
import { createSearchResultsEmbed } from "../actions/createSearchResultsEmbed";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

export default function handleInteractionCreate(
  interaction: Interaction,
  listeners: {
    wm: ContentListener;
    meco: ContentListener;
    ofn: ContentListener;
    rpr: ContentListener;
    hl: ContentListener;
    hh: ContentListener;
    yt: ContentListener;
  }
) {
  if (!interaction.isCommand()) return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === "rss") {
    return interaction.client.emit(ContentBotEvents.RSS_LIST, interaction);
  }

  if (subCommand === "help") {
    return interaction.reply({ embeds: [createPodcastHelpEmbed()] });
  }

  const show = options.getString("show", true);
  const feedListener = listeners[show] as ContentListener;

  let returnMessage: MessageOptions = {
    embeds: [],
  };

  if (subCommand === "search") {
    const term = options.getString("term");
    const results = feedListener.search(term).slice(0, 3);
    returnMessage.embeds.push(
      createSearchResultsEmbed(
        results,
        feedListener.title,
        feedListener.albumArt,
        term
      )
    );
  }

  if (subCommand === "recent") {
    const episode = feedListener.fetchRecent();
    returnMessage.embeds.push(createUniqueResultEmbed(episode));
  }

  if (subCommand === "episode-number") {
    const epNum = options.getInteger("episode-number");
    const episode = feedListener.getEpisodeByNumber(epNum);
    if (episode) {
      returnMessage.embeds.push(createUniqueResultEmbed(episode));
    } else {
      returnMessage.content = "No episode with that number.";
    }
  }

  interaction.reply(returnMessage);
}
