// Modules
import express, { Request, Response, Router } from "express";
import { Client } from "discord.js";

// Providers
import { Ndb2Client } from "../../../providers/ndb2-client";
import { Ndb2MsgSubscription } from "../../../providers/db/models/Ndb2MsgSubscription";

// Actions
import {
  guildProvider,
  logRequest,
  validateWebhookAuthorization,
  validateWebhookEvent,
  webhookResponser,
} from "./middleware";
import { Providers } from "../../../providers";
import { handleV1Webhook } from "./v1";
import { handleV2Webhook } from "./v2";
import * as API from "@offnominal/ndb2-api-types/v2";
import { NDB2WebhookEvent } from "./v1/types";
import { getLoggerFromContext } from "./contexts";
import { LogStatus } from "../../../logger/Logger";

export default function createWebooksRouter(
  ndb2Bot: Client,
  ndb2Client: Ndb2Client,
  ndb2MsgSubscription: Ndb2MsgSubscription,
  cache: Providers["cache"]
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
    async (req: Request, res: Response) => {
      const logger = getLoggerFromContext();

      if (
        req.body.event_name === NDB2WebhookEvent.NEW_PREDICTION ||
        req.body.event_name === NDB2WebhookEvent.UNTRIGGERED_PREDICTION ||
        req.body.event_name === NDB2WebhookEvent.UNJUDGED_PREDICTION ||
        req.body.event_name === NDB2WebhookEvent.RETIRED_PREDICTION
      ) {
        logger.addLog(
          LogStatus.INFO,
          `Event was ${req.body.event_name}, which is currently ignored.`
        );
        return logger.sendLog(ndb2Bot);
      }

      return handleV1Webhook(
        req,
        ndb2Bot,
        ndb2Client,
        ndb2MsgSubscription,
        cache
      );
    }
  );

  router.post(
    "/ndb2/v2",
    [
      validateWebhookAuthorization,
      validateWebhookEvent,
      webhookResponser,
      logRequest,
      guildProvider(ndb2Bot),
    ],
    async (req: Request, res: Response) => {
      const payload = req.body;

      if (!API.Webhooks.isWebhookPayloadV2(payload)) {
        return "womp";
      }

      return handleV2Webhook(payload, ndb2MsgSubscription);
    }
  );

  return router;
}
