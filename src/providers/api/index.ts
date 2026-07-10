import mcconfig from "../../mcconfig";
import express from "express";
import { getDiscordBootStatus } from "../../helpers/discord-client-connect";

const api = express();

// Middleware
api.use(express.json());
if (mcconfig.env !== "production") {
  const morgan = require("morgan");
  api.use(morgan("dev"));
}

api.get("/health", (req, res) => {
  const discord = getDiscordBootStatus();

  const discordPayload = Object.fromEntries(
    discord.bots.map((bot) => [
      bot.label,
      {
        status: bot.status,
        ...(bot.retryInSec !== undefined && { retryInSec: bot.retryInSec }),
        ...(bot.retryAt && { retryAt: bot.retryAt }),
        ...(bot.message && { message: bot.message }),
      },
    ]),
  );

  if (discord.allReady) {
    return res.status(200).json({
      status: "healthy",
      discord: discordPayload,
    });
  }

  return res.status(503).json({
    status: "unhealthy",
    reason: discord.summary,
    discord: discordPayload,
  });
});

api.get("*", (req, res) => res.status(404).json("Invalid Resource."));

export default api;
