import mcconfig from "../../../mcconfig";

// Modules
import express, { Router } from "express";
import { Client, GuildMember, userMention } from "discord.js";

// Providers
import { LogInitiator, Logger, LogStatus } from "../../../logger/Logger";

// Actions
import { updatePredictionEmbeds } from "../actions/updatePredictionEmbeds";
import { sendPublicNotice } from "../actions/sendPublicNotice";
import fetchGuild from "../../../helpers/fetchGuild";
import { sendSeasonStartNotice } from "../actions/sendSeasonStartNotice";
import { sendSeasonEndNotice } from "../actions/sendSeasonEndNotice";

import { NDB2WebhookEvent, isNdb2WebhookEvent } from "./types";
import { Ndb2MsgSubscription } from "../../../providers/db/models/Ndb2MsgSubscription";
import { API } from "../../../providers/db/models/types";
export * from "./types";

export default function createWebooksRouter(
  ndb2Bot: Client,
  ndb2MsgSubscription: Ndb2MsgSubscription
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

    const { event_name, data } = req.body;

    // verify body
    if (!isNdb2WebhookEvent(event_name)) {
      logger.addLog(
        LogStatus.FAILURE,
        `Webhook body data was not a recognized Webhook event, rejecting. Event name was '${event_name}'.`
      );
      logger.sendLog(ndb2Bot);
      return res.json("no thank u");
    } else {
      logger.addLog(LogStatus.INFO, `Event is '${event_name}'`);
    }

    // tell the API to go away
    res.json("thank u");
    logger.addLog(LogStatus.INFO, "Responded to webhook.");

    if (event_name === NDB2WebhookEvent.NEW_PREDICTION) {
      logger.addLog(
        LogStatus.INFO,
        "Event was NEW PREDICTION, which is currently ignored."
      );
      return logger.sendLog(ndb2Bot);
    }

    if (event_name === NDB2WebhookEvent.SEASON_START) {
      logger.addLog(
        LogStatus.INFO,
        "Event was SEASON START, generating embed notice."
      );
      return sendSeasonStartNotice(ndb2Bot, data);
    }

    if (event_name === NDB2WebhookEvent.SEASON_END) {
      logger.addLog(
        LogStatus.INFO,
        "Event was SEASON END, generating embed notice."
      );
      return sendSeasonEndNotice(ndb2Bot, data);
    }

    // Fetch subscriptions to events
    let subs: API.Ndb2MsgSubscription[];
    try {
      subs = await ndb2MsgSubscription.fetchActiveSubs(data.id);
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
      predictor = await guild.members.fetch(data.predictor.discord_id);
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched predictor User ${userMention(predictor.id)}.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch predictor User ${userMention(
          data.predictor.discord_id
        )} for this event, will fallback to defauls.`
      );
    }

    logger.addLog(LogStatus.INFO, `Passing log to update functions.`);
    logger.sendLog(ndb2Bot);

    updatePredictionEmbeds(ndb2Bot, subs, predictor, data);

    if (
      event_name === NDB2WebhookEvent.RETIRED_PREDICTION ||
      event_name === NDB2WebhookEvent.TRIGGERED_PREDICTION ||
      event_name === NDB2WebhookEvent.JUDGED_PREDICTION
    ) {
      sendPublicNotice(
        ndb2Bot,
        ndb2MsgSubscription,
        predictor,
        data,
        event_name
      );
    }
  });

  return router;
}
