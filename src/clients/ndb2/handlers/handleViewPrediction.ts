import { add } from "date-fns";
import {
  CacheType,
  ChatInputCommandInteraction,
  GuildMember,
} from "discord.js";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
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
    let predictor: GuildMember | undefined = undefined;

    try {
      predictor = await interaction.guild.members.fetch(
        prediction.predictor.discord_id
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error Retrieving a prediction for a user. Proceeding with fallback.`
      );
    }

    try {
      const reply = generatePredictionResponse(predictor, prediction);
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
  };
}
