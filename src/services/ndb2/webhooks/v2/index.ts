import * as API_v2 from "@offnominal/ndb2-api-types/v2";
import {
  fetchMessagesFromSubs,
  generateBulkMessageUpdater,
  generateSender,
  getSubByType,
  isDiscordNotFound,
} from "../helpers";
import { API } from "../../../../providers/db/models/types";
import { Ndb2MsgSubscription } from "../../../../providers/db/models/Ndb2MsgSubscription";
import { getGuildFromContext, getLoggerFromContext } from "../contexts";
import { LogStatus } from "../../../../logger/Logger";
import { generateInteractionReplyFromTemplate } from "../../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../../actions/embedGenerators/templates/helpers/types";
import { Client, GuildMember, messageLink, userMention } from "discord.js";
import mcconfig from "../../../../mcconfig";
import { add } from "date-fns";
import { Providers } from "../../../../providers";

const fallbackContextChannelId = mcconfig.discord.channels.general;

export const handleV2Webhook = (
  payload: API_v2.Webhooks.Payload,
  ndb2Bot: Client,
  ndb2MsgSubscription: Ndb2MsgSubscription,
  cache: Providers["cache"],
) => {
  const logger = getLoggerFromContext();
  const guild = getGuildFromContext();

  const sendMessage = generateSender(guild);

  // Fetch subscriptions to prediction in Discord
  const subsPromise = ndb2MsgSubscription
    .fetchActiveSubs(payload.data.prediction.id)
    .then((subs) => {
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched ${subs.length} subscriptions to process for this event.`,
      );
      return subs;
    })
    .catch((err) => {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch message subscriptions for this event, cannot process any further.`,
      );
      throw err;
    });

  // Fetch discord user for Prediction
  const predictorPromise = guild.members
    .fetch(payload.data.prediction.predictor.discord_id)
    .then((predictor) => {
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched predictor User ${userMention(predictor.id)}.`,
      );
      return predictor;
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch predictor User ${userMention(
          payload.data.prediction.predictor.discord_id,
        )} for this event, will fallback to defauls.`,
      );
      return undefined;
    });

  // Fetch Triggerer User from Discord
  const triggererPromise: Promise<GuildMember | undefined> = payload.data
    .prediction.triggerer
    ? guild.members
        .fetch(payload.data.prediction.triggerer.discord_id)
        .then((triggerer) => {
          logger.addLog(
            LogStatus.SUCCESS,
            "Triggerer Discord profile successfully fetched",
          );
          return triggerer;
        })
        .catch((err) => {
          console.error(err);
          logger.addLog(
            LogStatus.FAILURE,
            `Failed to fetch triggerer from Discord, cannot post notice.`,
          );
          throw err;
        })
    : Promise.resolve(undefined);

  Promise.all([subsPromise, predictorPromise, triggererPromise]).then(
    ([subs, predictor, triggerer]) => {
      logger.addLog(LogStatus.INFO, `Passing log to update functions.`);

      const contextMessage = getSubByType(
        subs,
        API.Ndb2MsgSubscriptionType.CONTEXT,
      );
      const contextChannelId =
        contextMessage?.channelId ?? fallbackContextChannelId;

      const updateBulkMessages = generateBulkMessageUpdater(subs, guild);

      const updateStandardViews = (
        prediction: API_v2.Entities.Predictions.Prediction,
      ) => {
        const standardViewOptions = generateInteractionReplyFromTemplate(
          NDB2EmbedTemplate.View.STANDARD,
          {
            prediction,
            displayName: predictor?.displayName,
            avatarUrl: predictor?.displayAvatarURL(),
            context: contextMessage,
          },
        );

        updateBulkMessages([API.Ndb2MsgSubscriptionType.VIEW], {
          embeds: standardViewOptions[0],
          components: standardViewOptions[1],
        });
      };

      const clearNoticeSubs = (types: API.Ndb2MsgSubscriptionType[]) => {
        const messages = fetchMessagesFromSubs(subs, types, guild);

        for (const mp of messages) {
          mp
            .then((m) => {
              if (!m) return;
              return m.delete();
            })
            .catch((err: unknown) => {
              if (!isDiscordNotFound(err)) {
                console.error(err);
              }
            });
        }

        const noticeSubs = subs.filter((s) => types.includes(s.type));

        noticeSubs.map((sub) => {
          return ndb2MsgSubscription.expireSubById(sub.id);
        });
      };

      switch (payload.event_name) {
        case "triggered_prediction": {
          // update VIEW subs
          updateStandardViews(payload.data.prediction);

          // Send Trigger Notice
          const [embeds, components] = generateInteractionReplyFromTemplate(
            NDB2EmbedTemplate.View.TRIGGER,
            {
              prediction: payload.data.prediction,
              predictor,
              client: ndb2Bot,
              triggerer,
              context: contextMessage,
            },
          );

          sendMessage(contextChannelId, embeds, components).then((message) => {
            // Log the trigger notice subscription
            ndb2MsgSubscription.addSubscription(
              API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
              payload.data.prediction.id,
              message.channel.id,
              message.id,
              add(new Date(), { hours: 36 }),
            );

            // Update any trigger interaction replies
            const reply = cache.ndb2.triggerResponses[payload.data.prediction.id];

            if (reply) {
              reply
                .fetchReply()
                .then((r) =>
                  r.edit({
                    content:
                      "A voting notice has been posted here: " +
                      messageLink(contextChannelId, message.id),
                  }),
                )
                .then(() => {
                  delete cache.ndb2.triggerResponses[payload.data.prediction.id];
                })
                .catch((err) => {
                  console.error(err);
                  logger.addLog(
                    LogStatus.FAILURE,
                    "Failed to update trigger interaction reply.",
                  );
                });
            }
          });

          break;
        }
        case "untriggered_prediction": {
          // update VIEW subs
          updateStandardViews(payload.data.prediction);

          // Delete any trigger notices
          clearNoticeSubs([API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE]);

          break;
        }
        case "unjudged_prediction": {
          // update VIEW subs
          updateStandardViews(payload.data.prediction);

          // Delete any trigger or judgement notices
          clearNoticeSubs([
            API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
            API.Ndb2MsgSubscriptionType.JUDGEMENT_NOTICE,
          ]);

          break;
        }
        case "retired_prediction": {
          // update VIEW subs
          updateStandardViews(payload.data.prediction);

          break;
        }
        case "new_bet": {
          // update VIEW subs
          updateStandardViews(payload.data.prediction);
          break;
        }
        case "new_vote": {
          // update VIEW subs
          updateStandardViews(payload.data.prediction);

          // Update Trigger Notice
          const [embeds, components] = generateInteractionReplyFromTemplate(
            NDB2EmbedTemplate.View.TRIGGER,
            {
              prediction: payload.data.prediction,
              predictor,
              client: ndb2Bot,
              triggerer,
              context: contextMessage,
            },
          );

          updateBulkMessages([API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE], {
            embeds,
            components,
          });
          break;
        }
        case "prediction_edit": {
          const edited_fields = payload.data.edited_fields;

          if (!edited_fields) {
            logger.addLog(
              LogStatus.FAILURE,
              "Edited fields were not present in the event, cannot process any further.",
            );
            return logger.sendLog(ndb2Bot);
          }

          // update VIEW subs
          updateStandardViews(payload.data.prediction);

          // Send notice of Edit
          const [embeds, components] = generateInteractionReplyFromTemplate(
            NDB2EmbedTemplate.View.PREDICTION_EDIT,
            {
              prediction: payload.data.prediction,
              predictor,
              edited_fields,
            },
          );

          sendMessage(contextChannelId, embeds, components);
          break;
        }
        case "new_snooze_vote": {
          // update SNOOZE subs
          const [embeds, components] = generateInteractionReplyFromTemplate(
            NDB2EmbedTemplate.View.SNOOZE_CHECK,
            {
              prediction: payload.data.prediction,
              client: ndb2Bot,
              context: contextMessage,
            },
          );

          updateBulkMessages([API.Ndb2MsgSubscriptionType.SNOOZE_CHECK], {
            embeds,
            components,
          });
          break;
        }
        case "snoozed_prediction": {
          // update SNOOZE subs
          const [embeds, components] = generateInteractionReplyFromTemplate(
            NDB2EmbedTemplate.View.SNOOZE_CHECK,
            {
              prediction: payload.data.prediction,
              client: ndb2Bot,
              context: contextMessage,
            },
          );

          updateBulkMessages([API.Ndb2MsgSubscriptionType.SNOOZE_CHECK], {
            embeds,
            components,
          });

          // Expire any subs for snooze notices
          const triggerSubs = subs.filter(
            (s) => s.type === API.Ndb2MsgSubscriptionType.SNOOZE_CHECK,
          );

          triggerSubs.map((sub) => {
            return ndb2MsgSubscription.expireSubById(sub.id);
          });
          break;
        }
      }
    },
  );
};
