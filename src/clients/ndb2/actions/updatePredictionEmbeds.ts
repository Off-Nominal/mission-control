import {
  channelMention,
  Client,
  GuildMember,
  messageLink,
  userMention,
} from "discord.js";
import { Client as DbClient } from "pg";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscription,
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { LogInitiator } from "../../../types/logEnums";
import fetchGuild from "../../../utilities/fetchGuild";
import { Logger, LogStatus } from "../../../utilities/logger";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePredictionResponse } from "./generatePredictionResponse";

export const updatePredictionEmbeds = async (
  client: Client,
  db: DbClient,
  prediction: NDB2API.EnhancedPrediction
) => {
  const { fetchSubs } = ndb2MsgSubscriptionQueries(db);

  const logger = new Logger(
    "Webhook Response",
    LogInitiator.NDB2,
    "Update subscribed Embeds"
  );

  const guild = fetchGuild(client);

  let subs: Ndb2MsgSubscription[];

  try {
    subs = await fetchSubs(prediction.id);
    logger.addLog(
      LogStatus.SUCCESS,
      `Fetched ${subs.length} message subscriptions to update.`
    );
  } catch (err) {
    console.error(err);
    logger.addLog(
      LogStatus.FAILURE,
      `Failed to fetch message subscriptions from database.`
    );
    return logger.sendLog(client);
  }

  // Fetch subscriptions and update messages as needed
  const updates = [];

  let predictor: GuildMember;

  try {
    predictor = await guild.members.fetch(prediction.predictor.discord_id);
    logger.addLog(
      LogStatus.SUCCESS,
      `Fetched predictor data for ${userMention(predictor.id)} successfully`
    );
  } catch (err) {
    console.error(err);
    logger.addLog(
      LogStatus.FAILURE,
      `Failed to fetch predictor from Discord, cannot update embeds.`
    );
    return logger.sendLog(client);
  }

  for (const sub of subs) {
    if (sub.type !== Ndb2MsgSubscriptionType.VIEW) {
      continue;
    }

    const message = guild.channels
      .fetch(sub.channel_id)
      .then((channel) => {
        if (channel.isTextBased()) {
          return channel.messages.fetch(sub.message_id);
        } else {
          throw new Error("Not a text based channel");
        }
      })
      .then((message) => {
        logger.addLog(
          LogStatus.SUCCESS,
          `Message (id: ${message.id}) fetched succesfully `
        );
        const response = generatePredictionResponse(predictor, prediction);
        return message.edit(response);
      })
      .then((message) => {
        logger.addLog(
          LogStatus.SUCCESS,
          `Message (id: ${message.id}) edited succesfully `
        );
      })
      .catch((err) => {
        logger.addLog(
          LogStatus.FAILURE,
          `Message subscription in channel ${channelMention(
            sub.channel_id
          )} message ${messageLink(
            sub.channel_id,
            sub.message_id
          )} failed to update.`
        );
        console.error(err);
      });

    updates.push(message);
  }

  Promise.allSettled(updates)
    .finally(() => {
      logger.addLog(
        LogStatus.INFO,
        `All message subscription update processed. See above for any errors.`
      );
      logger.sendLog(client);
    })
    .catch((err) => console.error(err));
};
