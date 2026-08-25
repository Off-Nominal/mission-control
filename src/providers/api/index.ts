import mcconfig from "../../mcconfig";
import express from "express";
import { getAppHealth } from "../../helpers/discord-client-connect";

const api = express();

// Middleware
api.use(express.json());
if (mcconfig.env !== "production") {
  const morgan = require("morgan");
  api.use(morgan("dev"));
}

function healthBody() {
  const health = getAppHealth();
  return {
    status: health.phase,
    ready: health.ready,
    alert: health.alert,
    bootAgeSec: health.bootAgeSec,
    reason: health.reason,
    discord: health.discord,
  };
}

// Liveness: always 200 while the process is up so orchestrators do not restart
// the container during Discord boot or session rate-limit cool-off. Use the
// `alert` field (or GET /ready) for Coolify/monitoring webhooks.
api.get("/health", (req, res) => {
  return res.status(200).json(healthBody());
});

// Readiness: 503 until every Discord gateway client is connected.
api.get("/ready", (req, res) => {
  const body = healthBody();

  if (body.ready) {
    return res.status(200).json(body);
  }

  return res.status(503).json(body);
});

api.get("*", (req, res) => res.status(404).json("Invalid Resource."));

export default api;
