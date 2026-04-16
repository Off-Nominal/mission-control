import { Request } from "express";
import { LogStatus } from "../../../../logger/Logger";
import { getGuildFromContext, getLoggerFromContext } from "../contexts";
import { NDB2WebhookEvent } from "./types";
import { NDB2API, Ndb2Client } from "../../../../providers/ndb2-client";
import { Client } from "discord.js";
import { handleSeasonStart } from "../handlers/season_start";
import { handleSeasonEnd } from "../handlers/season_end";

// Don't any new handlers here, add them to v2 instead

export const handleV1Webhook = (
  req: Request,
  ndb2Bot: Client,
  ndb2Client: Ndb2Client,
) => {
  const logger = getLoggerFromContext();
  const guild = getGuildFromContext();

  const { event_name, data } = req.body;

  if (event_name === NDB2WebhookEvent.SEASON_START) {
    const season: NDB2API.Season = data.season;

    if (!season) {
      logger.addLog(
        LogStatus.FAILURE,
        "Season data was not present in the event, cannot process any further.",
      );
      return logger.sendLog(ndb2Bot);
    }

    return handleSeasonStart({
      guild,
      client: ndb2Bot,
      season,
    });
  }

  if (event_name === NDB2WebhookEvent.SEASON_END) {
    const results: NDB2API.SeasonResults = data.results;

    if (!results) {
      logger.addLog(
        LogStatus.FAILURE,
        "Season data was not present in the event, cannot process any further.",
      );
      return logger.sendLog(ndb2Bot);
    }

    return handleSeasonEnd({
      ndb2Client,
      guild,
      client: ndb2Bot,
      results,
    });
  }

  logger.addLog(
    LogStatus.INFO,
    `Event was ${event_name}, which is currently handled by the v2 webhook route.`,
  );
  return logger.sendLog(ndb2Bot);
};
