import { userMention } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import * as NDB2API from "@offnominal/ndb2-api-types/v2";

const isSnoozeVoteValue = (
  value: number,
): value is NDB2API.Entities.SnoozeVotes.SnoozeVoteValue => {
  return NDB2API.Entities.SnoozeVotes.SNOOZE_VOTE_VALUES.includes(
    value as NDB2API.Entities.SnoozeVotes.SnoozeVoteValue,
  );
};

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

    if (!isSnoozeVoteValue(days)) {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "New Snooze Vote",
    );

    const discordId = interaction.member?.user.id;

    if (!discordId) {
      logger.addLog(
        LogStatus.FAILURE,
        `User is not a member of the server, so we cannot add a snooze vote.`,
      );
      return logger.sendLog(interaction.client);
    }

    logger.addLog(
      LogStatus.INFO,
      `New snooze vote made by ${userMention(
        discordId,
      )} on prediction #${predictionId}`,
    );

    let prediction: NDB2API.Entities.Predictions.Prediction;

    // Add Snooze
    try {
      prediction = await ndb2Client.addSnoozeVote(
        predictionId,
        snoozeCheckId,
        discordId,
        days,
      );

      logger.addLog(
        LogStatus.SUCCESS,
        `Snooze Vote was successfully submitted to NDB2`,
      );
    } catch (err) {
      if (!Array.isArray(err)) {
        logger.addLog(
          LogStatus.FAILURE,
          `There was an error submitting the Snooze Vote. Could not parse error.`,
        );
        return logger.sendLog(interaction.client);
      }

      const [userError, LogError] = err;
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the Snooze Vote. ${LogError}`,
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
        `Successfully notified user of snooze vote success.`,
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the prediction was submitted.`,
      );
    }

    logger.sendLog(interaction.client);
  });
}
