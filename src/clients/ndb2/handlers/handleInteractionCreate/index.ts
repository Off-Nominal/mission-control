import { Interaction } from "discord.js";
import { Logger, LogInitiator, LogStatus } from "../../../../services/logger";
import { handleModalInteraction } from "./modal";
import { handleButtonInteraction } from "./button";
import { handleSlashCommandInteraction } from "./slash";

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  // Handle Modal Submissions for new Predictions
  if (interaction.isModalSubmit()) {
    return handleModalInteraction(interaction);
  }

  // Handle Button Submissions for Endorsements, Undorsements and Details
  if (interaction.isButton()) {
    return handleButtonInteraction(interaction);
  }

  if (!interaction.isChatInputCommand()) {
    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Interaction Unhandled"
    );

    logger.addLog(
      LogStatus.WARNING,
      `Received a non-supported interaction, which is not supposed to happen.`
    );

    return logger.sendLog(interaction.client);
  }

  // Handle Chat Input Commands for all slash commands
  handleSlashCommandInteraction(interaction);
}
