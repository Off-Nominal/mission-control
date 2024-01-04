import mcconfig from "../../../mcconfig";

// Modules
import express, { Router } from "express";
import { Client, GuildMember, messageLink, userMention } from "discord.js";

// Providers
import { LogInitiator, Logger, LogStatus } from "../../../logger/Logger";

// Actions
import { updatePredictionEmbeds } from "../actions/updatePredictionEmbeds";
import { triggeredPredictionWebhookHandler } from "./handlers/triggered_prediction";
import fetchGuild from "../../../helpers/fetchGuild";
import { seasonStartWebhookHandler } from "./handlers/season_start";
import { seasonEndWebhookHandler } from "./handlers/season_end";

import { NDB2Webhook, NDB2WebhookEvent, verifyWebhookPayload } from "./types";
import { Ndb2MsgSubscription } from "../../../providers/db/models/Ndb2MsgSubscription";
import { API } from "../../../providers/db/models/types";
import { NotificationsProvider } from "../../../providers/notifications";
import { retiredPredictionWebhookHandler } from "./handlers/retired_prediction";
import { judgedPredictionWebhookHandler } from "./handlers/judged_prediction";
export * from "./types";

export default function createWebooksRouter(
  ndb2Bot: Client,
  ndb2MsgSubscription: Ndb2MsgSubscription,
  notifications: NotificationsProvider
): Router {
  const router = express.Router();

  router.post("/ndb2", async (req, res) => {
    const logger = new Logger(
      "Webhook Receipt",
      LogInitiator.NDB2,
      "A webhook was recieved from NDB2"
    );

    // verify source of webhook
    if (req.headers.authorization !== `Bearer ${mcconfig.ndb2.clientId}`) {
      logger.addLog(
        LogStatus.FAILURE,
        "Webhook did not have sufficient credentials, rejecting."
      );
      logger.sendLog(ndb2Bot);
      return res.status(401).json({
        error: "Authentication credentials missing or incorrect.",
      });
    } else {
      logger.addLog(LogStatus.SUCCESS, "Webhook credentials verified.");
    }

    let webhookData: NDB2Webhook;

    try {
      webhookData = verifyWebhookPayload(req.body.event_name, req.body.data);
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Webhook body data was not a recognized Webhook event, rejecting. Event name was '${req.body.event_name}'.`
      );
      logger.sendLog(ndb2Bot);
      return res.json("no thank u");
    }

    // tell the API to go away
    res.json("thank u");
    logger.addLog(LogStatus.INFO, "Responded to webhook.");

    if (webhookData.event === NDB2WebhookEvent.NEW_PREDICTION) {
      logger.addLog(
        LogStatus.INFO,
        "Event was NEW PREDICTION, which is currently ignored."
      );
      return logger.sendLog(ndb2Bot);
    }

    if (webhookData.event === NDB2WebhookEvent.SEASON_START) {
      logger.addLog(
        LogStatus.INFO,
        "Event was SEASON START, generating embed notice."
      );
      return seasonStartWebhookHandler(ndb2Bot, webhookData.data);
    }

    if (webhookData.event === NDB2WebhookEvent.SEASON_END) {
      logger.addLog(
        LogStatus.INFO,
        "Event was SEASON END, generating embed notice."
      );

      return seasonEndWebhookHandler(ndb2Bot, webhookData.data);
    }

    // Fetch subscriptions to events
    let subs: API.Ndb2MsgSubscription[];
    try {
      subs = await ndb2MsgSubscription.fetchActiveSubs(webhookData.data.id);
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched ${subs.length} subscriptions to process for this event.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch message subscriptions for this event, cannot process any further.`
      );
      logger.sendLog(ndb2Bot);
      return console.error(err);
    }

    const guild = fetchGuild(ndb2Bot);

    // Fetch Guild Member for Predictor
    let predictor: GuildMember | undefined = undefined;
    try {
      predictor = await guild.members.fetch(
        webhookData.data.predictor.discord_id
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched predictor User ${userMention(predictor.id)}.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch predictor User ${userMention(
          webhookData.data.predictor.discord_id
        )} for this event, will fallback to defaults.`
      );
    }

    logger.addLog(LogStatus.INFO, `Passing log to update functions.`);
    logger.sendLog(ndb2Bot);

    updatePredictionEmbeds(ndb2Bot, subs, predictor, webhookData.data);

    if (webhookData.event === NDB2WebhookEvent.RETIRED_PREDICTION) {
      const { data } = webhookData;
      retiredPredictionWebhookHandler(
        ndb2Bot,
        guild,
        ndb2MsgSubscription,
        predictor,
        webhookData.data
      ).then((message) => {
        notifications.emit("ndb_bet_retired", data, message.url);
      });
    }

    if (webhookData.event === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
      const { data } = webhookData;
      triggeredPredictionWebhookHandler(
        ndb2Bot,
        guild,
        ndb2MsgSubscription,
        predictor,
        webhookData.data
      ).then((message) => {
        notifications.emit("ndb_prediction_closed", data, message.url);
        notifications.emit("ndb_bet_closed", data, message.url);
      });
    }

    if (webhookData.event === NDB2WebhookEvent.JUDGED_PREDICTION) {
      const { data } = webhookData;
      judgedPredictionWebhookHandler(
        ndb2Bot,
        guild,
        ndb2MsgSubscription,
        predictor,
        webhookData.data
      ).then((message) => {
        notifications.emit("ndb_prediction_judged", data, message.url);
        notifications.emit("ndb_bet_judged", data, message.url);
      });
    }
  });

  return router;
}
