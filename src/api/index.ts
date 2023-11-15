import mcconfig from "../mcconfig";
import express from "express";
import db from "../db";

import { ndb2Bot } from "../discord_clients";
import generateNDB2WebhookRouter from "./routers/webhooks";

const api = express();

// Middleware
api.use(express.json());
if (mcconfig.env !== "production") {
  const morgan = require("morgan");
  api.use(morgan("dev"));
}

// Routers
api.use("/webhooks", generateNDB2WebhookRouter(ndb2Bot, db));
api.get("*", (req, res) => res.status(404).json("Invalid Resource."));

export default api;
