import { channelMention, Client, messageLink } from "discord.js";
import { Client as DbClient } from "pg";
import express from "express";
import { LogInitiator } from "../types/logEnums";
import { Logger, LogStatus } from "../utilities/logger";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscriptionType,
} from "../queries/ndb2_msg_subscriptions";
import fetchGuild from "../utilities/fetchGuild";
import { generatePredictionEmbed } from "../clients/ndb2/actions/generatePredictionEmbed";
const router = express.Router();

enum NDB2WebhookEvent {
  NEW_PREDICTION = "new_prediction",
  NEW_BET = "new_bet",
  RETIRED_PREDICTION = "retired_prediction",
}

const isNdb2WebhookEvent = (event: any): event is NDB2WebhookEvent => {
  if (typeof event !== "string") {
    return false;
  }

  return Object.values(NDB2WebhookEvent).includes(event as NDB2WebhookEvent);
};

const generateNDB2WebhookRouter = (client: Client, db: DbClient) => {
  const { fetchSubs } = ndb2MsgSubscriptionQueries(db);

  return router.post("/ndb2", async (req, res) => {
    // verify source of webhook
    const refHost = new URL(process.env.NDB2_API_BASEURL);
    console.log(process.env.NDB2_API_BASEURL);
    console.log(refHost);
    if (req.hostname !== refHost.hostname) {
      return res.status(401).json("UNAUTHORIZED");
    }

    const { event_name, data } = req.body;

    // verify body
    if (!isNdb2WebhookEvent(event_name)) {
      return res.status(400).json({
        error: "Body params missing valid event name",
      });
    }

    if (event_name === NDB2WebhookEvent.NEW_PREDICTION) {
      console.log("new prediction");
    }

    if (event_name === NDB2WebhookEvent.RETIRED_PREDICTION) {
      console.log("retired prediction");
    }

    if (event_name === NDB2WebhookEvent.NEW_BET) {
      const prediction = data;

      // Fetch subscriptions and update any embeds
      try {
        const logger = new Logger(
          "Webhook Response",
          LogInitiator.NDB2,
          "Webhook - New Bet"
        );

        const subs = await fetchSubs(prediction.id);
        logger.addLog(
          LogStatus.INFO,
          `Fetched ${subs.length} message subscriptions to update.`
        );

        const updates = [];

        const guild = fetchGuild(client);

        for (const sub of subs) {
          const viewUpdate = [];

          const message = guild.channels
            .fetch(sub.channel_id)
            .then((channel) => {
              if (channel.isTextBased()) {
                return channel.messages.fetch(sub.message_id);
              }
            });

          viewUpdate.push(message);

          if (sub.type === Ndb2MsgSubscriptionType.VIEW) {
            const predictor = guild.members.fetch(
              prediction.predictor.discord_id
            );

            viewUpdate.push(predictor);

            const update = Promise.all(viewUpdate)
              .then(([message, predictor]) => {
                const embed = generatePredictionEmbed(
                  predictor.displayName,
                  predictor.displayAvatarURL(),
                  prediction
                );
                return message.edit({ embeds: [embed] });
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

            updates.push(update);
          }
        }

        Promise.all(updates).then(() => {
          logger.addLog(
            LogStatus.INFO,
            `All ${subs.length} message subscriptions successfully updated.`
          );
        });
      } catch (err) {
        console.error(err);
      }
    }

    res.json("thank u");
  });
};

export default generateNDB2WebhookRouter;
