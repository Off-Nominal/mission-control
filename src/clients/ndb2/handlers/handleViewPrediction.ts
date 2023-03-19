import { add, format, isFuture, isValid } from "date-fns";
import {
  CacheType,
  ChatInputCommandInteraction,
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

export default function generateHandleViewPrediction(db: Client) {
  const { addSubscription } = ndb2MsgSubscriptionQueries(db);

  return async function handleViewPrediction(
    interaction: ChatInputCommandInteraction<CacheType>,
    prediction: NDB2API.EnhancedPrediction
  ) {
    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "View Prediction"
    );

    // Generate response
    try {
      const predictor = await interaction.guild.members.fetch(
        prediction.predictor.discord_id
      );

      const reply = await generatePredictionResponse(predictor, prediction);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction embed was successfully generated.`
      );
      interaction.reply(reply);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction embed was successfully delivered to channel.`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error Retrieving a prediction for a user. ${err.response.data.message}`
      );
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
  };
}
