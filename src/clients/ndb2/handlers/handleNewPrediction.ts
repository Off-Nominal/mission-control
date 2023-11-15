import { add, isFuture } from "date-fns";
import {
  Message,
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
import { validateUserDateInput } from "../helpers/validateUserDateInput";
import mcconfig from "../../../mcconfig";
import {
  Ndb2MsgSubscriptionType,
  addSubscription,
} from "../../../queries/ndb2_msg_subscriptions";

export default async function handleNewPrediction(
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
  const isDueDateValid = validateUserDateInput(due);
  if (!isDueDateValid) {
    logger.addLog(
      LogStatus.WARNING,
      `User entered invalid timestamp, prediction rejected`
    );
    logger.sendLog(interaction.client);
    return interaction.reply({
      content: `Your due date format was invalid. Ensure it is entered as YYYY-MM-DD. If you need to re-enter your prediction, you can copy and paste it from here:\n\n${text}`,
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
    const response = await ndb2Client.addPrediction(
      discordId,
      text,
      due_date.toISOString()
    );
    prediction = response.data;
    logger.addLog(
      LogStatus.SUCCESS,
      `Prediction was successfully submitted to NDB2`
    );
  } catch ([userError, LogError]) {
    interaction.reply({
      ephemeral: true,
      content: `There was an error submitting the prediction to NDB2. ${userError}`,
    });
    logger.addLog(
      LogStatus.FAILURE,
      `There was an error submitting the prediction. ${LogError}`
    );
    return logger.sendLog(interaction.client);
  }

  try {
    const predictor = await interaction.guild.members.fetch(
      prediction.predictor.discord_id
    );

    const reply = generatePredictionResponse(predictor, prediction);
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
      `Prediction context message subscription log failure.`
    );
    console.error(err);
  }

  let reply: Message<boolean>;

  // Add subscription for embed
  try {
    reply = await interaction.fetchReply();
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

  try {
    const botsChannel = await interaction.guild.channels.cache.find(
      (c) => c.id === mcconfig.discord.channels.bots
    );
    if (botsChannel.isTextBased()) {
      botsChannel.send({
        content: `NDB2->TC ${channelId} ${reply.id} ${prediction.text}`,
      });
    }
    logger.addLog(LogStatus.SUCCESS, `New Prediction TC Alert logged`);
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, `New Prediction TC Alert Message failure`);
    console.error(err);
  }

  logger.sendLog(interaction.client);
}
