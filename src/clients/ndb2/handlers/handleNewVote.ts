import { ButtonInteraction, userMention } from "discord.js";
import { Client } from "pg";
import { LogInitiator } from "../../../types/logEnums";
import { Logger, LogStatus } from "../../../utilities/logger";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { ButtonCommand } from "./handleInteractionCreate/button";

export default function generateHandleNewVote(db: Client) {
  return async function handleNewVote(
    interaction: ButtonInteraction,
    predictionId: string,
    command: string
  ) {
    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "New Vote"
    );

    const discordId = interaction.member.user.id;
    const vote = command === ButtonCommand.AFFIRM;

    logger.addLog(
      LogStatus.INFO,
      `New ${command} vote by ${userMention(
        discordId
      )} on prediction #${predictionId}`
    );

    let prediction: NDB2API.EnhancedPrediction;

    // Add Vote
    try {
      prediction = await ndb2Client.addVote(predictionId, discordId, vote);
      logger.addLog(
        LogStatus.SUCCESS,
        `Vote was successfully submitted to NDB2`
      );
    } catch ([userError, LogError]) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the vote. ${LogError}`
      );

      interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the vote to NDB2. ${userError}`,
      });
      return logger.sendLog(interaction.client);
    }

    // Reply to Discord
    try {
      interaction.reply({
        content: `Prediction #${predictionId} successfully voted for (${command.toLowerCase()})!`,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully notified user of vote success.`
      );
    } catch (err) {
      console.log(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the vote was submitted. ${err.response.data.message}`
      );
    }

    logger.sendLog(interaction.client);
  };
}
