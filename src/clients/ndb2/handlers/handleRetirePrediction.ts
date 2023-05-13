import { add, isBefore, sub } from "date-fns";
import { ButtonInteraction, InteractionResponse } from "discord.js";
import { Client } from "pg";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { LogInitiator } from "../../../types/logEnums";
import { Logger, LogStatus } from "../../../utilities/logger";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import ndb2InteractionCache from "../../../utilities/ndb2Client/ndb2InteractionCache";

export default function generateHandleRetirePrediction(db: Client) {
  const { addSubscription, deleteSubById } = ndb2MsgSubscriptionQueries(db);

  const handleRetirePrediction = async (
    interaction: ButtonInteraction,
    predictionId: string
  ) => {
    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "Retire Prediction"
    );

    let prediction: NDB2API.EnhancedPrediction;

    try {
      const response = await ndb2Client.getPrediction(predictionId);
      prediction = response.data;
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully retrieved from NDB2.`
      );
    } catch ([userError, LogError]) {
      interaction.reply({
        content: `There was an error fetching the prediction for this retirement. ${userError}`,
        ephemeral: true,
      });
      return logger.addLog(
        LogStatus.WARNING,
        `There was an error fetching the prediction for this retirement. ${LogError}`
      );
    }

    // Clear the confirmation dialog
    try {
      ndb2InteractionCache.retirements[prediction.id]
        ?.deleteReply()
        .then(() => {
          delete ndb2InteractionCache.retirements[prediction.id];
        });
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, `Could not clear confirmation dialog.`);
      console.error(err);
    }

    const deleterId = interaction.user.id;

    let subId: number;
    let subSuccess = false;

    // Add and await retirement subscription so that webhook has something to operate on
    // This is an anchor so it knows where to post the retirement notice
    try {
      subId = await addSubscription(
        Ndb2MsgSubscriptionType.RETIREMENT,
        prediction.id,
        interaction.channelId
      );
      subSuccess = true;
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction retirement context logged successfully.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction retirement context could not be logged. Fallback will be used for location of retirement notice.`
      );
    }

    try {
      await ndb2Client.retirePrediction(prediction.id, deleterId);
      logger.addLog(LogStatus.SUCCESS, `Prediction retired successfully.`);
    } catch ([userError, LogError]) {
      interaction.reply({
        content: `Retiring this prediction failed. ${userError}`,
        ephemeral: true,
      });

      // Remove subscription since retirement failed
      deleteSubById(subId).catch((err) => console.error(err));

      logger.addLog(
        LogStatus.FAILURE,
        `Error sending retirement request to API. ${LogError}`
      );

      return logger.sendLog(interaction.client);
    }

    try {
      const noticeMessage = subSuccess
        ? `A cancellation notice will be posted here.`
        : `There was an error capturing the current channel, so the cancellation notice may be posted in a different channel.`;
      await interaction.reply({
        content: `Prediction #${prediction.id} has been cancelled and all bets on it will not count. ${noticeMessage}`,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `User successfully notified of prediction retirement.`
      );
    } catch (err) {
      console.log(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Error sending interaction response to user.`
      );
      return logger.sendLog(interaction.client);
    }

    logger.sendLog(interaction.client);
  };

  return handleRetirePrediction;
}
