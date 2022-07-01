import { Interaction, MessageOptions } from "discord.js";
import { ContentWatcher } from "../../../listeners/feedListener/contentWatcher";
import { createPodcastHelpEmbed } from "../actions/createPodcastHelpEmbed";
import { createSearchResultsEmbed } from "../actions/createSearchResultsEmbed";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

export default function handleInteractionCreate(
  interaction: Interaction,
  listeners: {
    wm: ContentWatcher;
    meco: ContentWatcher;
    ofn: ContentWatcher;
    rpr: ContentWatcher;
    hl: ContentWatcher;
    hh: ContentWatcher;
    yt: ContentWatcher;
  }
) {
  if (!interaction.isCommand()) return;

  const { options } = interaction;
  const subCommand = options.getSubcommand(false);

  if (subCommand === "help") {
    return interaction.reply({ embeds: [createPodcastHelpEmbed()] });
  }

  const show = options.getString("show", true);
  const feedListener = listeners[show] as ContentWatcher;

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
