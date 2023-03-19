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
      prediction = await ndb2Client.getPrediction(predictionId);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully retrieved from NDB2.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.WARNING,
        `Prediction does not exist, interaction rejected.`
      );
      return interaction.reply({
        content: "No prediction exists with that id.",
        ephemeral: true,
      });
    }

    const deleterId = interaction.user.id;

    if (deleterId !== prediction.predictor.discord_id) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to retire another user's predition.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "You cannot retire other people's predictions.",
        ephemeral: true,
      });
    }

    const now = new Date();
    const createDate = new Date(prediction.created_date);
    const editWindow = add(createDate, { hours: 12 });

    if (isBefore(editWindow, now)) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to retire prediction after edit window.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "Predictions can only be deleted within 12 hours of creation.",
        ephemeral: true,
      });
    }

    let subId: number;

    // Add and await retirement subscription so that webhook has something to operate on
    try {
      subId = await addSubscription(
        Ndb2MsgSubscriptionType.RETIREMENT,
        prediction.id,
        interaction.channelId
      );
      console.log(subId);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction retirement context logged successfully.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction retirement context could not be logged..`
      );
      return logger.sendLog(interaction.client);
    }

    try {
      await ndb2Client.retirePrediction(prediction.id, deleterId);
      logger.addLog(LogStatus.SUCCESS, `Prediction retired successfully.`);
    } catch (err) {
      // Remove subscription since retirement failed
      deleteSubById(subId);

      console.log(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Error sending retirement request to API.`
      );
      return logger.sendLog(interaction.client);
    }

    let interactionResponse: InteractionResponse;

    try {
      interactionResponse = await interaction.reply({
        content: `Prediction #${prediction.id} has been cancelled and all bets on it will not count. A prediction cancellation notice will be posted here`,
        ephemeral: true,
      });
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
