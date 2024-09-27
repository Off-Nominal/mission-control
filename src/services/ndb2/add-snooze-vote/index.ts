import { userMention } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API } from "../../../providers/ndb2-client";

export default function AddSnoozeVote({ ndb2Bot, ndb2Client }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    const [command, predictionId, snoozeCheckId, daysString] =
      interaction.customId.split(" ");

    if (command !== "Snooze") {
      return;
    }

    const days = parseInt(daysString);

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "New Snooze Vote"
    );

    const discordId = interaction.member.user.id;

    logger.addLog(
      LogStatus.INFO,
      `New snooze vote made by ${userMention(
        discordId
      )} on prediction #${predictionId}`
    );

    let prediction: NDB2API.EnhancedPrediction;

    // Add Snooze
    try {
      const response = await ndb2Client.addSnoozeVote(
        predictionId,
        snoozeCheckId,
        discordId,
        days
      );
      prediction = response.data;
      logger.addLog(
        LogStatus.SUCCESS,
        `Snooze Vote was successfully submitted to NDB2`
      );
    } catch ([userError, LogError]) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the Snooze Vote. ${LogError}`
      );

      interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the Snooze Vote to NDB2. ${userError}`,
      });
      logger.sendLog(interaction.client);
      return;
    }

    // Reply to Discord
    try {
      interaction.reply({
        content: `Prediction #${predictionId} Snooze Vote successfully updated!`,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully notified user of snooze vote success.`
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
