import { userMention } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API } from "../../../providers/ndb2-client";

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
      interaction.client
    );

    const discordId = interaction.member.user.id;
    const vote = command === "Affirm";

    logger.addLog(
      LogStatus.INFO,
      `New ${command} vote by ${userMention(
        discordId
      )} on prediction #${predictionId}`
    );

    let prediction: NDB2API.EnhancedPrediction;
    let message: string;

    // Add Vote
    try {
      const response = await ndb2Client.addVote(predictionId, discordId, vote);
      prediction = response.data;
      message = response.message;
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
        `Successfully notified user of vote success.`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the vote was submitted. ${err.response.data.message}`
      );
    }

    logger.sendLog(interaction.client);
  });
}
