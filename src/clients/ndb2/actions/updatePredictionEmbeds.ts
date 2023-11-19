// Modules
import {
  BaseMessageOptions,
  channelMention,
  Client,
  GuildMember,
  messageLink,
} from "discord.js";

// Providers
import {
  Logger,
  LogStatus,
  LogInitiator,
} from "../../../services/logger/Logger";
import { NDB2API } from "../../../providers/ndb2-client";
import { NDB2WebhookEvent } from "../../../services/ndb2/webhooks";

import {
  Ndb2MsgSubscription,
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";

// Actions
import fetchGuild from "../../../utilities/fetchGuild";
import { generatePredictionResponse } from "./generatePredictionResponse";
import { generatePublicNotice } from "./generatePublicNotice";

export const updatePredictionEmbeds = async (
  client: Client,
  subs: Ndb2MsgSubscription[],
  predictor: GuildMember | undefined,
  prediction: NDB2API.EnhancedPrediction
) => {
  const logger = new Logger(
    "Webhook Response",
    LogInitiator.NDB2,
    "Update subscribed Embeds"
  );

  const guild = fetchGuild(client);

  const updates = [];

  let triggerer: Promise<GuildMember | null>;
  let viewResponse: BaseMessageOptions;
  let triggerResponse: BaseMessageOptions;

  for (const sub of subs) {
    if (
      sub.type !== Ndb2MsgSubscriptionType.VIEW &&
      sub.type !== Ndb2MsgSubscriptionType.TRIGGER_NOTICE
    ) {
      continue;
    }

    const message = guild.channels.fetch(sub.channel_id).then((channel) => {
      if (channel.isTextBased()) {
        return channel.messages.fetch(sub.message_id);
      } else {
        throw new Error("Not a text based channel");
      }
    });

    if (sub.type === Ndb2MsgSubscriptionType.TRIGGER_NOTICE && !triggerer) {
      triggerer = prediction.triggerer
        ? guild.members
            .fetch(prediction.triggerer.discord_id)
            .then((triggerer) => {
              logger.addLog(
                LogStatus.SUCCESS,
                "Triggerer Discord profile successfully fetched"
              );
              return triggerer;
            })
            .catch((err) => {
              console.error(err);
              logger.addLog(
                LogStatus.FAILURE,
                `Failed to fetch triggerer from Discord, cannot post notice.`
              );
              throw err;
            })
        : Promise.resolve(null);
    }

    Promise.all([message, triggerer])
      .then(([message, triggerer]) => {
        logger.addLog(
          LogStatus.SUCCESS,
          `Message (id: ${messageLink(
            message.channelId,
            message.id
          )}) fetched succesfully `
        );

        if (sub.type === Ndb2MsgSubscriptionType.VIEW) {
          if (!viewResponse) {
            viewResponse = generatePredictionResponse(predictor, prediction);
            logger.addLog(
              LogStatus.SUCCESS,
              "Generated View Prediction Response"
            );
          }
          return message.edit(viewResponse);
        } else {
          if (!triggerResponse) {
            triggerResponse = generatePublicNotice(
              prediction,
              NDB2WebhookEvent.TRIGGERED_PREDICTION,
              predictor,
              triggerer,
              client
            );
            logger.addLog(
              LogStatus.SUCCESS,
              "Generated Trigger Prediction Response"
            );
          }
          return message.edit(triggerResponse);
        }
      })
      .then((message) => {
        logger.addLog(
          LogStatus.SUCCESS,
          `Message (id: ${messageLink(
            message.channelId,
            message.id
          )}) edited succesfully `
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
