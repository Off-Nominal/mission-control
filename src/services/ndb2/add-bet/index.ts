import { userMention } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API } from "../../../providers/ndb2-client";

export default function AddBet({ ndb2Bot, ndb2Client }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    const [command, predictionId] = interaction.customId.split(" ");

    if (command !== "Endorse" && command !== "Undorse") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "New Bet",
      interaction.client
    );

    const discordId = interaction.member.user.id;
    const endorsed = command === "Endorse";

    logger.addLog(
      LogStatus.INFO,
      `New ${command} made by ${userMention(
        discordId
      )} on prediction #${predictionId}`
    );

    let prediction: NDB2API.EnhancedPrediction;

    // Add Bet
    try {
      const response = await ndb2Client.addBet(
        predictionId,
        discordId,
        endorsed
      );
      prediction = response.data;
      logger.addLog(
        LogStatus.SUCCESS,
        `Bet was successfully submitted to NDB2`
      );
    } catch ([userError, LogError]) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the bet. ${LogError}`
      );

      interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the bet to NDB2. ${userError}`,
      });
      logger.sendLog(interaction.client);
      return;
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
  });
}
