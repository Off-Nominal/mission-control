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
import { handleV2Webhook } from "./v2";

export default function createWebooksRouter(
  ndb2Bot: Client,
  ndb2Client: Ndb2Client,
  ndb2MsgSubscription: Ndb2MsgSubscription,
  cache: Providers["cache"],
): Router {
  const router = express.Router();

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
      return handleV2Webhook(
        req.body,
        ndb2Bot,
        ndb2Client,
        ndb2MsgSubscription,
        cache,
      );
    },
  );

  return router;
}
