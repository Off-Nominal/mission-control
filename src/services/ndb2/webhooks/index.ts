import mcconfig from "../../../mcconfig";

// Modules
import express, { Request, Response, Router } from "express";
import {
  BaseMessageOptions,
  Client,
  GuildMember,
  MessageEditOptions,
  userMention,
} from "discord.js";

// Providers
import { LogInitiator, Logger, LogStatus } from "../../../logger/Logger";

// Actions
import fetchGuild from "../../../helpers/fetchGuild";

import { NDB2WebhookEvent } from "./types";
import { Ndb2MsgSubscription } from "../../../providers/db/models/Ndb2MsgSubscription";
import { API } from "../../../providers/db/models/types";
import {
  validateWebhookAuthorization,
  validateWebhookEvent,
} from "./middleware";
import { fetchMessagesFromSubs } from "./fetchMessagesFromSubs";
import { getSubByType } from "./getSubByType";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";
import { add } from "date-fns";
import { NDB2API, Ndb2Client } from "../../../providers/ndb2-client";

const fallbackContextChannelId = mcconfig.discord.channels.general;

export default function createWebooksRouter(
  ndb2Bot: Client,
  ndb2Client: Ndb2Client,
  ndb2MsgSubscription: Ndb2MsgSubscription
): Router {
  const router = express.Router();

  router.post(
    "/ndb2",
    [validateWebhookAuthorization, validateWebhookEvent],
    async (req: Request, res: Response) => {
      // tell the API to go away
      res.json("thank u");

      const logger = new Logger(
        "Webhook Receipt",
        LogInitiator.NDB2,
        "A webhook was recieved from NDB2"
      );

      const { event_name, data } = req.body;

      if (event_name === NDB2WebhookEvent.NEW_PREDICTION) {
        logger.addLog(
          LogStatus.INFO,
          "Event was NEW PREDICTION, which is currently ignored."
        );
        return logger.sendLog(ndb2Bot);
      }

      // Fetch dependencies
      const guild = fetchGuild(ndb2Bot);

      if (!guild) {
        logger.addLog(LogStatus.FAILURE, "No Guild Found");
        return logger.sendLog(ndb2Bot);
      }

      const sendMessage = (
        channelId: string,
        embeds: BaseMessageOptions["embeds"],
        components: BaseMessageOptions["components"]
      ) => {
        return guild.channels.fetch(channelId).then((channel) => {
          if (!channel || !channel.isTextBased()) {
            throw new Error("Context channel is not text based");
          }

          return channel.send({ embeds, components });
        });
      };

      if (event_name === NDB2WebhookEvent.SEASON_START) {
        logger.addLog(
          LogStatus.INFO,
          "Event was SEASON START, generating embed notice."
        );
        const [embeds, components] = generateInteractionReplyFromTemplate(
          NDB2EmbedTemplate.View.SEASON_START,
          {
            season: data,
          }
        );

        const generalChannel = guild.channels.cache.get(
          mcconfig.discord.channels.general
        );
        if (!generalChannel) {
          logger.addLog(LogStatus.FAILURE, "General Channel Not found");
          return logger.sendLog(ndb2Bot);
        }
        sendMessage(generalChannel.id, embeds, components);
      }

      if (event_name === NDB2WebhookEvent.SEASON_END) {
        logger.addLog(
          LogStatus.INFO,
          "Event was SEASON END, generating embed notice."
        );

        let predictionsLeaderboard: NDB2API.PredictionsLeader[] = [];
        let betsLeaderboard: NDB2API.BetsLeader[] = [];
        let pointsLeaderboard: NDB2API.PointsLeader[] = [];

        try {
          const promises: [
            Promise<NDB2API.GetPredictionsLeaderboard>,
            Promise<NDB2API.GetBetsLeaderboard>,
            Promise<NDB2API.GetPointsLeaderboard>
          ] = [
            ndb2Client.getPredictionsLeaderboard(data.results.season.id),
            ndb2Client.getBetsLeaderboard(data.results.season.id),
            ndb2Client.getPointsLeaderboard(data.results.season.id),
          ];
          await Promise.all(promises).then((leaderboards) => {
            predictionsLeaderboard = leaderboards[0].data.leaders;
            betsLeaderboard = leaderboards[1].data.leaders;
            pointsLeaderboard = leaderboards[2].data.leaders;
          });
        } catch (err) {
          logger.addLog(LogStatus.FAILURE, "Leaderboard fetch failed");
          logger.sendLog(ndb2Bot);
          return console.error(err);
        }

        const [embeds, components] = generateInteractionReplyFromTemplate(
          NDB2EmbedTemplate.View.SEASON_END,
          {
            results: data,
            predictionsLeaderboard,
            betsLeaderboard,
            pointsLeaderboard,
          }
        );

        const generalChannel = guild.channels.cache.get(
          mcconfig.discord.channels.general
        );
        if (!generalChannel) {
          logger.addLog(LogStatus.FAILURE, "General Channel Not found");
          return logger.sendLog(ndb2Bot);
        }
        sendMessage(generalChannel.id, embeds, components);
      }

      const subsPromise = ndb2MsgSubscription
        .fetchActiveSubs(data.id)
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

      const predictorPromise = guild.members
        .fetch(data.predictor.discord_id)
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
              data.predictor.discord_id
            )} for this event, will fallback to defauls.`
          );
          throw err;
        });

      // Fetch Triggerer
      const triggererPromise: Promise<GuildMember | undefined> = data.triggerer
        ? guild.members
            .fetch(data.triggerer.discord_id)
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

          const context = getSubByType(
            subs,
            API.Ndb2MsgSubscriptionType.CONTEXT
          );
          const contextChannelId =
            context?.channelId ?? fallbackContextChannelId;

          const updateBulkMessages = (
            subTypes: API.Ndb2MsgSubscriptionType[],
            options: MessageEditOptions
          ) => {
            const messages = fetchMessagesFromSubs(subs, subTypes, guild);

            messages.map((mp) => {
              return mp.then((m) => {
                return m.edit(options);
              });
            });
          };

          const updateStandardViews = () => {
            const standardViewOptions = generateInteractionReplyFromTemplate(
              NDB2EmbedTemplate.View.STANDARD,
              {
                prediction: data,
                displayName: predictor?.displayName,
                avatarUrl: predictor?.displayAvatarURL(),
                context,
              }
            );

            updateBulkMessages([API.Ndb2MsgSubscriptionType.VIEW], {
              embeds: standardViewOptions[0],
              components: standardViewOptions[1],
            });
          };

          switch (event_name) {
            case NDB2WebhookEvent.RETIRED_PREDICTION: {
              // update VIEW subs
              updateStandardViews();

              // send Retire Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.RETIREMENT,
                {
                  prediction: data,
                  predictor,
                  context,
                }
              );

              const retirementSourceChannel = getSubByType(
                subs,
                API.Ndb2MsgSubscriptionType.RETIREMENT
              );
              if (!retirementSourceChannel) {
                logger.addLog(
                  LogStatus.FAILURE,
                  "Retirement Source Channel Not found"
                );
                return logger.sendLog(ndb2Bot);
              }

              sendMessage(
                retirementSourceChannel.channelId,
                embeds,
                components
              );
              break;
            }
            case NDB2WebhookEvent.TRIGGERED_PREDICTION: {
              // update VIEW subs
              updateStandardViews();

              // Send Trigger Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.TRIGGER,
                {
                  prediction: data,
                  predictor,
                  client: ndb2Bot,
                  triggerer,
                  context,
                }
              );

              sendMessage(contextChannelId, embeds, components).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
                    data.id,
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
              updateStandardViews();

              // Shut down Snooze Notice
              const messages = fetchMessagesFromSubs(
                subs,
                [API.Ndb2MsgSubscriptionType.SNOOZE_CHECK],
                guild
              );

              const snoozeCheckMessage = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.SNOOZE_CHECK,
                {
                  prediction: data,
                  client: ndb2Bot,
                  context,
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
                  prediction: data,
                  predictor,
                  client: ndb2Bot,
                  triggerer,
                  context,
                }
              );

              sendMessage(contextChannelId, ...triggerNoticeMessage).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
                    data.id,
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
              updateStandardViews();

              // Send Judgement Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.JUDGEMENT,
                {
                  prediction: data,
                  client: ndb2Bot,
                  context,
                }
              );

              sendMessage(contextChannelId, embeds, components).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.JUDGEMENT_NOTICE,
                    data.id,
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
              updateStandardViews();
              break;
            }
            case NDB2WebhookEvent.NEW_VOTE: {
              // update VIEW subs
              updateStandardViews();

              // Update Trigger Notice
              const [embeds, components] = generateInteractionReplyFromTemplate(
                NDB2EmbedTemplate.View.TRIGGER,
                {
                  prediction: data,
                  predictor,
                  client: ndb2Bot,
                  triggerer,
                  context,
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
                  prediction: data,
                  client: ndb2Bot,
                  context,
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
                  prediction: data,
                  client: ndb2Bot,
                  context,
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
                  prediction: data,
                  client: ndb2Bot,
                  context,
                }
              );

              sendMessage(contextChannelId, embeds, components).then(
                (message) => {
                  // Log the trigger notice subscription
                  ndb2MsgSubscription.addSubscription(
                    API.Ndb2MsgSubscriptionType.SNOOZE_CHECK,
                    data.id,
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
