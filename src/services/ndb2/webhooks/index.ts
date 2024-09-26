import mcconfig from "../../../mcconfig";

// Modules
import express, { Request, Router } from "express";
import { Client, GuildMember, userMention } from "discord.js";
import { add } from "date-fns";

// Providers
import { LogStatus } from "../../../logger/Logger";
import { NDB2API, Ndb2Client } from "../../../providers/ndb2-client";
import { Ndb2MsgSubscription } from "../../../providers/db/models/Ndb2MsgSubscription";
import { API } from "../../../providers/db/models/types";

// Actions
import { NDB2WebhookEvent } from "./types";
import {
  guildProvider,
  logRequest,
  validateWebhookAuthorization,
  validateWebhookEvent,
  webhookResponser,
} from "./middleware";
import {
  getSubByType,
  fetchMessagesFromSubs,
  generateSender,
  generateBulkMessageUpdater,
} from "./helpers";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";
import { handleSeasonStart } from "./handlers/season_start";
import { handleSeasonEnd } from "./handlers/season_end";
import { getGuildFromContext, getLoggerFromContext } from "./contexts";
import NDB2 from "..";

const fallbackContextChannelId = mcconfig.discord.channels.general;

export default function createWebooksRouter(
  ndb2Bot: Client,
  ndb2Client: Ndb2Client,
  ndb2MsgSubscription: Ndb2MsgSubscription
): Router {
  const router = express.Router();

  router.post(
    "/ndb2",
    [
      validateWebhookAuthorization,
      validateWebhookEvent,
      webhookResponser,
      logRequest,
      guildProvider(ndb2Bot),
    ],
    async (req: Request) => {
      const logger = getLoggerFromContext();
      const guild = getGuildFromContext();

      const { event_name, data } = req.body;

      if (event_name === NDB2WebhookEvent.NEW_PREDICTION) {
        logger.addLog(
          LogStatus.INFO,
          "Event was NEW PREDICTION, which is currently ignored."
        );
        return logger.sendLog(ndb2Bot);
      }

      const sendMessage = generateSender(guild);

      if (event_name === NDB2WebhookEvent.SEASON_START) {
        const season: NDB2API.Season = data.season;

        if (!season) {
          logger.addLog(
            LogStatus.FAILURE,
            "Season data was not present in the event, cannot process any further."
          );
          return logger.sendLog(ndb2Bot);
        }

        return handleSeasonStart({
          guild,
          client: ndb2Bot,
          season,
        });
      }

      if (event_name === NDB2WebhookEvent.SEASON_END) {
        const results: NDB2API.SeasonResults = data.results;

        if (!results) {
          logger.addLog(
            LogStatus.FAILURE,
            "Season data was not present in the event, cannot process any further."
          );
          return logger.sendLog(ndb2Bot);
        }

        return handleSeasonEnd({
          ndb2Client,
          guild,
          client: ndb2Bot,
          results,
        });
      }

      // The remaning webhook events are prediction-based
      const prediction: NDB2API.EnhancedPrediction = data.prediction;

      if (!prediction) {
        logger.addLog(
          LogStatus.FAILURE,
          "Prediction data was not present in the event, cannot process any further."
        );
        return logger.sendLog(ndb2Bot);
      }

      // Fetch subscriptions to prediction in Discord
      const subsPromise = ndb2MsgSubscription
        .fetchActiveSubs(prediction.id)
        .then((subs) => {
          logger.addLog(
            LogStatus.SUCCESS,
            `Successfully fetched ${subs.length} subscriptions to process for this event.`
          );
          return subs;
        })
        .catch((err) => {
          logger.addLog(
            LogStatus.FAILURE,
            `Failed to fetch message subscriptions for this event, cannot process any further.`
          );
          throw err;
        });

      // Fetch discord user for Prediction
      const predictorPromise = guild.members
        .fetch(prediction.predictor.discord_id)
        .then((predictor) => {
          logger.addLog(
            LogStatus.SUCCESS,
            `Successfully fetched predictor User ${userMention(predictor.id)}.`
          );
          return predictor;
        })
        .catch((err) => {
          logger.addLog(
            LogStatus.FAILURE,
            `Failed to fetch predictor User ${userMention(
              prediction.predictor.discord_id
            )} for this event, will fallback to defauls.`
          );
          throw err;
        });

      // Fetch Triggerer User from Discord
      const triggererPromise: Promise<GuildMember | undefined> =
        prediction.triggerer
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
          : Promise.resolve(undefined);

      Promise.all([subsPromise, predictorPromise, triggererPromise])
        .then(([subs, predictor, triggerer]) => {
          logger.addLog(LogStatus.INFO, `Passing log to update functions.`);

          const contextMessage = getSubByType(
            subs,
            API.Ndb2MsgSubscriptionType.CONTEXT
          );
          const contextChannelId =
            contextMessage?.channelId ?? fallbackContextChannelId;

          const updateBulkMessages = generateBulkMessageUpdater(subs, guild);

          const updateStandardViews = (
            prediction: NDB2API.EnhancedPrediction
          ) => {
            const standardViewOptions = generateInteractionReplyFromTemplate(
              NDB2EmbedTemplate.View.STANDARD,
              {
                prediction,
                displayName: predictor?.displayName,
                avatarUrl: predictor?.displayAvatarURL(),
                context: contextMessage,
              }
            );

            updateBulkMessages([API.Ndb2MsgSubscriptionType.VIEW], {
              embeds: standardViewOptions[0],
              components: standardViewOptions[1],
            });
          };

          switch (event_name) {
            case NDB2WebhookEvent.PREDICTION_EDIT: {
              const edited_fields = data.edited_fields;

              if (!edited_fields) {
                logger.addLog(
                  LogStatus.FAILURE,
                  "Edited fields were not present in the event, cannot process any further."
                );
                return logger.sendLog(ndb2Bot);
              }

              // update VIEW subs
              updateStandardViews(prediction);

              // Send notice of Edit
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.PREDICTION_EDIT,
                {
                  prediction,
                  predictor,
                  edited_fields,
                }
              );

              sendMessage(contextChannelId, embeds, components);
              break;
            }
            case NDB2WebhookEvent.RETIRED_PREDICTION: {
              // update VIEW subs
              updateStandardViews(prediction);

              break;
            }
            case NDB2WebhookEvent.TRIGGERED_PREDICTION: {
              // update VIEW subs
              updateStandardViews(prediction);

              // Send Trigger Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.TRIGGER,
                {
                  prediction,
                  predictor,
                  client: ndb2Bot,
                  triggerer,
                  context: contextMessage,
                }
              );

              sendMessage(contextChannelId, embeds, components).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
                    prediction.id,
                    message.channel.id,
                    message.id,
                    add(new Date(), { hours: 36 })
                  );
                }
              );

              break;
            }
            case NDB2WebhookEvent.TRIGGERED_SNOOZE: {
              // update VIEW subs
              updateStandardViews(prediction);

              // Shut down Snooze Notice
              const messages = fetchMessagesFromSubs(
                subs,
                [API.Ndb2MsgSubscriptionType.SNOOZE_CHECK],
                guild
              );

              const snoozeCheckMessage = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.SNOOZE_CHECK,
                {
                  prediction,
                  client: ndb2Bot,
                  context: contextMessage,
                }
              );

              messages.map((mp) => {
                return mp.then((m) => {
                  return m.edit({
                    embeds: snoozeCheckMessage[0],
                    components: snoozeCheckMessage[1],
                  });
                });
              });

              // Send Trigger Notice
              const triggerNoticeMessage = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.TRIGGER,
                {
                  prediction,
                  predictor,
                  client: ndb2Bot,
                  triggerer,
                  context: contextMessage,
                }
              );

              sendMessage(contextChannelId, ...triggerNoticeMessage).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
                    prediction.id,
                    message.channel.id,
                    message.id,
                    add(new Date(), { hours: 36 })
                  );
                }
              );
              break;
            }
            case NDB2WebhookEvent.JUDGED_PREDICTION: {
              // update VIEW subs
              updateStandardViews(prediction);

              // Send Judgement Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.JUDGEMENT,
                {
                  prediction,
                  client: ndb2Bot,
                  context: contextMessage,
                }
              );

              sendMessage(contextChannelId, embeds, components).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.JUDGEMENT_NOTICE,
                    prediction.id,
                    message.channel.id,
                    message.id,
                    add(new Date(), { hours: 36 })
                  );
                }
              );
              break;
            }
            case NDB2WebhookEvent.NEW_BET: {
              // update VIEW subs
              updateStandardViews(prediction);
              break;
            }
            case NDB2WebhookEvent.NEW_VOTE: {
              // update VIEW subs
              updateStandardViews(prediction);

              // Update Trigger Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.TRIGGER,
                {
                  prediction,
                  predictor,
                  client: ndb2Bot,
                  triggerer,
                  context: contextMessage,
                }
              );

              updateBulkMessages([API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE], {
                embeds,
                components,
              });
              break;
            }
            case NDB2WebhookEvent.NEW_SNOOZE_VOTE: {
              // update SNOOZE subs
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.SNOOZE_CHECK,
                {
                  prediction,
                  client: ndb2Bot,
                  context: contextMessage,
                }
              );

              updateBulkMessages([API.Ndb2MsgSubscriptionType.SNOOZE_CHECK], {
                embeds,
                components,
              });
              break;
            }
            case NDB2WebhookEvent.SNOOZED_PREDICTION: {
              // update SNOOZE subs
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.SNOOZE_CHECK,
                {
                  prediction,
                  client: ndb2Bot,
                  context: contextMessage,
                }
              );

              updateBulkMessages([API.Ndb2MsgSubscriptionType.SNOOZE_CHECK], {
                embeds,
                components,
              });
              break;
            }
            case NDB2WebhookEvent.NEW_SNOOZE_CHECK: {
              // Send Snooze Check
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.SNOOZE_CHECK,
                {
                  prediction,
                  client: ndb2Bot,
                  context: contextMessage,
                }
              );

              sendMessage(contextChannelId, embeds, components).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.SNOOZE_CHECK,
                    prediction.id,
                    message.channel.id,
                    message.id,
                    add(new Date(), { hours: 36 })
                  );
                }
              );
              break;
            }
          }
        })
        .finally(() => {
          logger.sendLog(ndb2Bot);
        });
    }
  );

  return router;
}
