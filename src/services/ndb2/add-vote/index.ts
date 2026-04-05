import { userMention } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import * as API_V2 from "@offnominal/ndb2-api-types/v2";

export default function AddVote({ ndb2Bot, ndb2Client }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    const [command, predictionId] = interaction.customId.split(" ");

    if (command !== "Affirm" && command !== "Negate") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "New Vote",
    );

    const discordId = interaction.member.user.id;
    const vote = command === "Affirm";

    logger.addLog(
      LogStatus.INFO,
      `New ${command} vote by ${userMention(
        discordId,
      )} on prediction #${predictionId}`,
    );

    let prediction: API_V2.Entities.Predictions.Prediction;
    let message: string;

    // Add Vote
    try {
      prediction = await ndb2Client.addVote(predictionId, discordId, vote);
      logger.addLog(
        LogStatus.SUCCESS,
        `Vote was successfully submitted to NDB2`,
      );
    } catch ([userError, LogError]) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the vote. ${LogError}`,
      );

      interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the vote to NDB2. ${userError}`,
      });
      logger.sendLog(interaction.client);
      return;
    }

    // Reply to Discord
    try {
      interaction.reply({
        content: message,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully notified user of vote success.`,
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the vote was submitted. ${err.response.data.message}`,
      );
    }

    logger.sendLog(interaction.client);
  });
}
