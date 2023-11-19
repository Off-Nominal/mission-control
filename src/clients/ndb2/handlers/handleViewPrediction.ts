import { add } from "date-fns";
import {
  CacheType,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
import {
  Logger,
  LogInitiator,
  LogStatus,
} from "../../../services/logger/Logger";
import {
  Ndb2MsgSubscription,
  Ndb2MsgSubscriptionType,
  addSubscription,
  fetchSubByType,
} from "../../../queries/ndb2_msg_subscriptions";
import { NDB2API } from "../../../providers/ndb2-client";

export default async function handleViewPrediction(
  interaction: ChatInputCommandInteraction<CacheType>,
  prediction: NDB2API.EnhancedPrediction
) {
  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    "View Prediction"
  );

  // Generate response
  let predictor: GuildMember | undefined = undefined;

  try {
    predictor = await interaction.guild.members.fetch(
      prediction.predictor.discord_id
    );
    logger.addLog(
      LogStatus.SUCCESS,
      `Successfully retrieved the predictor of this prediction.`
    );
  } catch (err) {
    logger.addLog(
      LogStatus.FAILURE,
      `There was an error retrieving the predictor for this prediction. Using fallback.`
    );
  }

  // Fetch Context
  let context: { messageId: string; channelId: string };
  let contextSub: Ndb2MsgSubscription;
  try {
    const contextSubs = await fetchSubByType(
      prediction.id,
      Ndb2MsgSubscriptionType.CONTEXT
    );
    if (contextSubs[0]) {
      contextSub = contextSubs[0];
      context = {
        channelId: contextSub.channel_id,
        messageId: contextSub.message_id,
      };
      logger.addLog(LogStatus.SUCCESS, `Prediction context retreived.`);
    } else {
      logger.addLog(LogStatus.INFO, `Prediction has no context.`);
    }
  } catch (err) {
    console.error(err);
    logger.addLog(
      LogStatus.FAILURE,
      `Failure to retrieve prediction context subscriptions.`
    );
  }

  // generate response
  try {
    const reply = generatePredictionResponse(predictor, prediction, context);
    interaction.reply(reply);
    logger.addLog(
      LogStatus.SUCCESS,
      `Prediction embed was successfully delivered to channel.`
    );
  } catch (err) {
    logger.addLog(
      LogStatus.FAILURE,
      `There was an error sending the reply to the discord.`
    );
    console.error(err);
    return logger.sendLog(interaction.client);
  }

  // Add subscription for embed
  try {
    const reply = await interaction.fetchReply();
    const channelId = interaction.channelId;
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
}
