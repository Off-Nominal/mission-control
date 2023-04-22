import { ButtonInteraction, CacheType } from "discord.js";
import { Ndb2Events } from "../../../../types/eventEnums";
import { LogInitiator } from "../../../../types/logEnums";
import { Logger, LogStatus } from "../../../../utilities/logger";
import ndb2InteractionCache from "../../../../utilities/ndb2Client/ndb2InteractionCache";

export enum ButtonCommand {
  ENDORSE = "Endorse",
  UNDORSE = "Undorse",
  DETAILS = "Details",
  AFFIRM = "Affirm",
  NEGATE = "Negate",
  RETIRE = "Retire",
  TRIGGER = "Trigger",
}

export const handleButtonInteraction = (
  interaction: ButtonInteraction<CacheType>
) => {
  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    "NDB2 Button Interaction Handler"
  );
  const [command, predictionId, ...args] = interaction.customId.split(" ");

  logger.addLog(
    LogStatus.INFO,
    `Interaction is a Button Submit - Command: ${command}, Prediction ID: ${predictionId}`
  );

  const isBet =
    command === ButtonCommand.ENDORSE || command === ButtonCommand.UNDORSE;

  const isVote =
    command === ButtonCommand.AFFIRM || command === ButtonCommand.NEGATE;

  if (isBet) {
    logger.addLog(
      LogStatus.INFO,
      `Interaction is a Bet Submit - handing off to NEW_BET handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(
      Ndb2Events.NEW_BET,
      interaction,
      predictionId,
      command
    );
  }

  if (command === ButtonCommand.DETAILS) {
    logger.addLog(
      LogStatus.INFO,
      `Interaction is a View Details request - handing off to VIEW_DETAILS handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(
      Ndb2Events.VIEW_DETAILS,
      interaction,
      predictionId
    );
  }

  if (command === ButtonCommand.RETIRE) {
    logger.addLog(
      LogStatus.INFO,
      `Interaction is a Retire Prediction request - handing off to RETIRE_PREDICTION handler.`
    );
    logger.sendLog(interaction.client);

    return interaction.client.emit(
      Ndb2Events.RETIRE_PREDICTION,
      interaction,
      predictionId
    );
  }

  if (command === ButtonCommand.TRIGGER) {
    logger.addLog(
      LogStatus.INFO,
      `Interaction is a Trigger Prediction request - handing off to TRIGGER prediction handler.`
    );
    logger.sendLog(interaction.client);

    const [close_date] = args;

    return interaction.client.emit(
      Ndb2Events.TRIGGER_PREDICTION,
      interaction,
      predictionId,
      close_date
    );
  }

  if (isVote) {
    logger.addLog(
      LogStatus.INFO,
      `Interaction is a Prediction Vote request - handing off to VOTE handler.`
    );
    logger.sendLog(interaction.client);

    return interaction.client.emit(
      Ndb2Events.NEW_VOTE,
      interaction,
      predictionId,
      command
    );
  }

  return;
};
