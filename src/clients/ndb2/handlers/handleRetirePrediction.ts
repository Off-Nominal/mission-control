import { add, isBefore } from "date-fns";
import { ButtonInteraction } from "discord.js";
import { Client } from "pg";
import { LogInitiator } from "../../../types/logEnums";
import { Logger, LogStatus } from "../../../utilities/logger";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";

export default function generateHandleRetirePrediction(db: Client) {
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

    try {
      await ndb2Client.retirePrediction(prediction.id, deleterId);
      logger.addLog(LogStatus.SUCCESS, `Prediction retired successfully.`);
      interaction.reply({
        content: `Prediction #${prediction.id} has been cancelled. All bets against it are cancelled as well.`,
      });
    } catch (err) {
      console.log(err);
      interaction.reply({
        content: "Error deleting prediction.",
        ephemeral: true,
      });
    }

    logger.sendLog(interaction.client);
  };

  return handleRetirePrediction;
}
