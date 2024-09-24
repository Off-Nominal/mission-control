import mcconfig from "../../../mcconfig";

import { NextFunction, Request, Response } from "express";
import { isNdb2WebhookEvent } from "./types";

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
