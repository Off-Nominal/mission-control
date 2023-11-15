import { ButtonInteraction, userMention } from "discord.js";
import {
  Logger,
  LogInitiator,
  LogStatus,
} from "../../../services/logger/Logger";
import { ButtonCommand } from "./handleInteractionCreate/button";
import ndb2Client, { NDB2API } from "../../../providers/ndb2";

export default async function handleNewBet(
  interaction: ButtonInteraction,
  predictionId: string,
  command: string
) {
  const logger = new Logger("NDB2 Interaction", LogInitiator.NDB2, "New Bet");

  const discordId = interaction.member.user.id;
  const endorsed = command === ButtonCommand.ENDORSE;

  logger.addLog(
    LogStatus.INFO,
    `New ${command} made by ${userMention(
      discordId
    )} on prediction #${predictionId}`
  );

  let prediction: NDB2API.EnhancedPrediction;

  // Add Bet
  try {
    const response = await ndb2Client.addBet(predictionId, discordId, endorsed);
    prediction = response.data;
    logger.addLog(LogStatus.SUCCESS, `Bet was successfully submitted to NDB2`);
  } catch ([userError, LogError]) {
    logger.addLog(
      LogStatus.FAILURE,
      `There was an error submitting the bet. ${LogError}`
    );

    interaction.reply({
      ephemeral: true,
      content: `There was an error submitting the bet to NDB2. ${userError}`,
    });
    return logger.sendLog(interaction.client);
  }

  // Reply to Discord
  try {
    interaction.reply({
      content: `Prediction #${predictionId} successfully ${command.toLowerCase()}d!`,
      ephemeral: true,
    });
    logger.addLog(
      LogStatus.SUCCESS,
      `Successfully notified user of bet success.`
    );
  } catch (err) {
    console.error(err);
    logger.addLog(
      LogStatus.FAILURE,
      `There was an error responding to the prediction in the channel, but the prediction was submitted. ${err.response.data.message}`
    );
  }

  logger.sendLog(interaction.client);
}
