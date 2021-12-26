import { Interaction, TextChannel } from "discord.js";
import { createPodcastHelpEmbed } from "../../actions/createPodcastHelpEmbed";
import { generateHelpEmbed } from "../actions/generateHelpEmbed";
import { marsTime } from "../actions/marstime/marsTime";
import shunt from "../actions/shunt";

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  if (!interaction.isCommand()) return;

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (commandName === "podcasts" && subCommand === "help") {
    return interaction.reply({ embeds: [createPodcastHelpEmbed()] });
  }

  if (commandName === "shunt") {
    const channel = options.getChannel("channel", true) as TextChannel;
    const topic = options.getString("topic", true);
    const thread = options.getBoolean("thread");
    shunt(interaction, channel, topic, thread);
  }

  if (commandName === "help") {
    interaction.reply({ embeds: [generateHelpEmbed()] });
  }

  if (commandName === "marstime") {
    const spacecraft = options.getString("spacecraft");
    const embed = await marsTime(spacecraft);
    interaction.reply({ embeds: [embed] });
  }

  if (commandName === "summary") {
    interaction.client.emit("summaryReportCreate", interaction);
  }
}
