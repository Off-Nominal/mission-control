import { Client, GuildMember, userMention } from "discord.js";
import { Client as DbClient } from "pg";
import express from "express";
import { updatePredictionEmbeds } from "../clients/ndb2/actions/updatePredictionEmbeds";
import { sendPublicNotice } from "../clients/ndb2/actions/sendPublicNotice";
import ndb2MsgSubscriptionQueries, {
  Ndb2MsgSubscription,
} from "../queries/ndb2_msg_subscriptions";
import fetchGuild from "../utilities/fetchGuild";
import { Logger, LogStatus } from "../utilities/logger";
import { LogInitiator } from "../types/logEnums";
import { isNdb2WebhookEvent, NDB2WebhookEvent } from "../types/routerTypes";
const router = express.Router();

const generateNDB2WebhookRouter = (client: Client, db: DbClient) => {
  const { fetchActiveSubs } = ndb2MsgSubscriptionQueries(db);

  return router.post("/ndb2", async (req, res) => {
    const logger = new Logger(
      "Webhook Receipt",
      LogInitiator.NDB2,
      "A webhook was recieved from NDB2"
    );

    // verify source of webhook
    if (req.headers.authorization !== `Bearer ${process.env.NDB2_CLIENT_ID}`) {
      logger.addLog(
        LogStatus.FAILURE,
        "Webhook did not have sufficient credentials, rejecting."
      );
      logger.sendLog(client);
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
      logger.sendLog(client);
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
      logger.sendLog(client);
      return console.log("new prediction");
    }

    // Fetch subscriptions to events
    let subs: Ndb2MsgSubscription[];
    try {
      subs = await fetchActiveSubs(data.id);
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched ${subs.length} subscriptions to process for this event.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch message subscriptions for this event, cannot process any further.`
      );
      logger.sendLog(client);
      return console.error(err);
    }

    const guild = fetchGuild(client);

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
    logger.sendLog(client);

    updatePredictionEmbeds(client, subs, predictor, data);

    if (
      event_name === NDB2WebhookEvent.RETIRED_PREDICTION ||
      event_name === NDB2WebhookEvent.TRIGGERED_PREDICTION ||
      event_name === NDB2WebhookEvent.JUDGED_PREDICTION
    ) {
      sendPublicNotice(client, predictor, db, data, event_name);
    }
  });
};

export default generateNDB2WebhookRouter;
