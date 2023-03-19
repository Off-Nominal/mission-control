import { add, isFuture } from "date-fns";
import {
  ModalSubmitInteraction,
  time,
  TimestampStyles,
  userMention,
} from "discord.js";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { Logger, LogStatus } from "../../../utilities/logger";
import { LogInitiator } from "../../../types/logEnums";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { Client } from "pg";

export default function generateNewPredictionHandler(db: Client) {
  const { addSubscription } = ndb2MsgSubscriptionQueries(db);

  return async function handleNewPrediction(
    interaction: ModalSubmitInteraction
  ) {
    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "New Prediction"
    );
    const text = interaction.fields.getTextInputValue("text");
    const due = interaction.fields.getTextInputValue("due");
    const dueDate = new Date(due);
    const discordId = interaction.member.user.id;
    const messageId = interaction.channel.lastMessageId;
    const channelId = interaction.channelId;

    logger.addLog(
      LogStatus.INFO,
      `New prediction made by ${userMention(discordId)} due ${time(
        dueDate,
        TimestampStyles.RelativeTime
      )}: ${text}`
    );

    // Validate date format
    const isDueDateValid = due.match(/^\d{4}\-\d{2}\-\d{2}$/g);
    if (!isDueDateValid) {
      logger.addLog(
        LogStatus.WARNING,
        `User entered invalid timestamp, prediction rejected`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: `Your Due date format was invalid. Ensure it is entered as YYYY-MM-DD. If you need to reneter your prediction, you can copy and paste it from here:\n\n${text}`,
        ephemeral: true,
      });
    }

    logger.addLog(LogStatus.INFO, `Due date is properly formed!`);

    const due_date = add(dueDate, { days: 1 });

    // Validate date is in the future
    if (!isFuture(due_date)) {
      logger.addLog(
        LogStatus.WARNING,
        `User entered timestamp in the past, prediction rejected`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: `Your due date is in the past. Please adjust your date and try again. If you need to reneter your prediction, you can copy and paste it from here:\n\n${text}`,
        ephemeral: true,
      });
    }

    logger.addLog(LogStatus.INFO, `Due date is correctly in the future!`);

    let prediction: NDB2API.EnhancedPrediction;

    try {
      prediction = await ndb2Client.addPrediction(
        discordId,
        text,
        due_date.toISOString()
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully submitted to NDB2`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the prediction. ${err.response.data.message}`
      );
      console.error(err);
      interaction.reply({
        ephemeral: true,
        content: "There was an error submitting the prediction to NDB2.",
      });
    }

    try {
      const predictor = await interaction.guild.members.fetch(
        prediction.predictor.discord_id
      );

      const reply = await generatePredictionResponse(predictor, prediction);
      interaction.reply(reply);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction embed was sent to the channel.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the prediction was submitted.`
      );
      console.error(err);
    }

    // Add subscription for message context
    try {
      await addSubscription(
        Ndb2MsgSubscriptionType.CONTEXT,
        prediction.id,
        channelId,
        messageId
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction context message subscription logged`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction context message subscription log failure`
      );
      console.error(err);
    }

    // Add subscription for embed
    try {
      const reply = await interaction.fetchReply();
      await addSubscription(
        Ndb2MsgSubscriptionType.VIEW,
        prediction.id,
        channelId,
        reply.id,
        add(new Date(), { hours: 36 })
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction view embed message subscription logged`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction view message subscription log failure.`
      );
      console.error(err);
    }

    logger.sendLog(interaction.client);
  };
}
