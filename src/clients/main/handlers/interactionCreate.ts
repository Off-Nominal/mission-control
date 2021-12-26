import { Interaction } from "discord.js";
import { createPodcastHelpEmbed } from "../../actions/createPodcastHelpEmbed";

export default function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const { options, commandName } = interaction;
  // const group = options.getSubcommandGroup();
  const subCommand = options.getSubcommand();
  // const searchString = options.getString("search-term", false);
  // const episodeNumber = options.getInteger("ep-number", false);

  if (commandName === "podcasts" && subCommand === "help") {
    return interaction.reply({ embeds: [createPodcastHelpEmbed()] });
  }
}
