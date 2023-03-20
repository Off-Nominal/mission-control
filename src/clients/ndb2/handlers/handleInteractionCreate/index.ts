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

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Chat Command Interaction"
    );

    // Reject anything from a wrong channel during beta
    if (
      process.env.NODE_ENV !== "dev" &&
      interaction.channelId !== "1084942074991878174"
    ) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to invoke NDB2 outside the playground channel, which is not supported.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "The new NDB2 is only available in the testing thread for now",
        ephemeral: true,
      });
    }

    // Handle Chat Input Commands for all slash commands
    handleSlashCommandInteraction(interaction);

    logger.sendLog(interaction.client);
  };
}
