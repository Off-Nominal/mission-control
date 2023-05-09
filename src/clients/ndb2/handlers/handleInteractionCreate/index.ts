import { Interaction } from "discord.js";
import { Client } from "pg";
import { LogInitiator } from "../../../../types/logEnums";
import { Logger, LogStatus } from "../../../../utilities/logger";
import { handleModalInteraction } from "./modal";
import { handleButtonInteraction } from "./button";
import { handleSlashCommandInteraction } from "./slash";

export default function generateHandleInteractionCreate(db: Client) {
  return async function handleInteractionCreate(interaction: Interaction) {
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
  };
}
