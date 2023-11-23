import { Interaction } from "discord.js";
import generateSummaryHelpEmbed from "../actions/generateSummary/generateSummaryHelpEmbed";
import { marsTime } from "../actions/marstime/marsTime";
import { HelperBotEvents } from "../../../providers/helper-bot";

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  if (!interaction.isChatInputCommand()) return;

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (commandName === "marstime") {
    const spacecraft = options.getString("spacecraft");
    const embed = await marsTime(spacecraft);
    interaction.reply({ embeds: [embed] });
  }

  if (commandName === "summary") {
    if (subCommand === "help") {
      return interaction.reply({ embeds: [generateSummaryHelpEmbed()] });
    }

    interaction.client.emit(HelperBotEvents.SUMMARY_CREATE, interaction);
  }
}
