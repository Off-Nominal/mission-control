import { Client } from "discord.js";
import { Client as DbClient } from "pg";
import express from "express";
import { updatePredictionEmbeds } from "../clients/ndb2/actions/updatePredictionEmbeds";
import { generateRetirementNotice } from "../clients/ndb2/actions/generateRetirementNotice";
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
  return router.post("/ndb2", async (req, res) => {
    // verify source of webhook

    if (req.headers.authorization !== `Bearer ${process.env.NDB2_CLIENT_ID}`) {
      return res.status(401).json({
        error: "Authentication credentials missing or incorrect.",
      });
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
      updatePredictionEmbeds(client, db, data);
      generateRetirementNotice(client, db, data);
      // unsubscribe embeds
    }

    if (event_name === NDB2WebhookEvent.NEW_BET) {
      updatePredictionEmbeds(client, db, data);
    }

    res.json("thank u");
  });
};

export default generateNDB2WebhookRouter;
