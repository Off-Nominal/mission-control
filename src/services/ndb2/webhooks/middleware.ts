import mcconfig from "../../../mcconfig";
import { AsyncLocalStorage } from "async_hooks";

import { NextFunction, Request, Response } from "express";
import { isNdb2WebhookEvent, NDB2WebhookEvent } from "./types";
import { Logger, LogInitiator, LogStatus } from "../../../logger/Logger";
import { getLoggerFromContext, guildContext, loggerContext } from "./contexts";
import { Client } from "discord.js";
import fetchGuild from "../../../helpers/fetchGuild";

export const validateWebhookAuthorization = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // verify source of webhook
  if (req.headers.authorization !== `Bearer ${mcconfig.ndb2.clientId}`) {
    return res.status(401).json({
      error: "Authentication credentials missing or incorrect.",
    });
  }

  next();
};

export const validateWebhookEvent = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { event_name } = req.body;

  if (!isNdb2WebhookEvent(event_name)) {
    return res.status(400).json({
      error: `Invalid Webhook Event Name. Event name was '${event_name}'.`,
    });
  }

  next();
};

export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  const logger = new Logger(
    "Webhook Receipt",
    LogInitiator.NDB2,
    "A webhook was recieved from NDB2"
  );
  loggerContext.run(logger, () => {
    next();
  });
};

export const webhookResponser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // tell the API to go away
  // we don't need to give the webhook anything, just a 200
  res.json("thank u");

  // currently ignored
  if (req.body.event_name === NDB2WebhookEvent.NEW_PREDICTION) {
    return;
  }

  next();
};

export const guildProvider = (client: Client) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logger = getLoggerFromContext();

    const guild = fetchGuild(client);

    if (!guild) {
      logger.addLog(LogStatus.FAILURE, "No Guild Found");
      return logger.sendLog(client);
    }

    guildContext.run(guild, () => {
      next();
    });
  };
};
