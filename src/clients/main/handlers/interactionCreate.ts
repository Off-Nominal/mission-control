import { Interaction, TextChannel } from "discord.js";
import { createPodcastHelpEmbed } from "../../actions/createPodcastHelpEmbed";
import { shunt } from "../actions/shunt";

export default function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const { options, commandName } = interaction;
  // const group = options.getSubcommandGroup();
  const subCommand = options.getSubcommand(false);
  // const episodeNumber = options.getInteger("ep-number", false);

  if (commandName === "podcasts" && subCommand === "help") {
    return interaction.reply({ embeds: [createPodcastHelpEmbed()] });
  }

  if (commandName === "shunt") {
    const channel = options.getChannel("channel", true) as TextChannel;
    const topic = options.getString("topic", true);
    const thread = options.getBoolean("thread");
    shunt(interaction, channel, topic, thread);
  }
}
