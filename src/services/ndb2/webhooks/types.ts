import { NDB2API } from "../../../providers/ndb2-client";

export enum NDB2WebhookEvent {
  NEW_PREDICTION = "new_prediction",
  NEW_BET = "new_bet",
  RETIRED_PREDICTION = "retired_prediction",
  TRIGGERED_PREDICTION = "triggered_prediction",
  NEW_VOTE = "new_vote",
  JUDGED_PREDICTION = "judged_prediction",
  SEASON_START = "season_start",
  SEASON_END = "season_end",
}

export type NDB2Webhook =
  | {
      event:
        | NDB2WebhookEvent.NEW_PREDICTION
        | NDB2WebhookEvent.NEW_BET
        | NDB2WebhookEvent.RETIRED_PREDICTION
        | NDB2WebhookEvent.TRIGGERED_PREDICTION
        | NDB2WebhookEvent.NEW_VOTE
        | NDB2WebhookEvent.JUDGED_PREDICTION;
      data: NDB2API.EnhancedPrediction;
    }
  | {
      event: NDB2WebhookEvent.SEASON_START;
      data: NDB2API.Season;
    }
  | {
      event: NDB2WebhookEvent.SEASON_END;
      data: NDB2API.SeasonResults;
    };

export const verifyWebhookPayload = (
  event_name: any,
  data: any
): NDB2Webhook => {
  if (event_name === NDB2WebhookEvent.NEW_PREDICTION) {
    return {
      event: NDB2WebhookEvent.NEW_PREDICTION,
      data: data as NDB2API.EnhancedPrediction,
    };
  }

  if (event_name === NDB2WebhookEvent.NEW_BET) {
    return {
      event: NDB2WebhookEvent.NEW_BET,
      data: data as NDB2API.EnhancedPrediction,
    };
  }

  if (event_name === NDB2WebhookEvent.RETIRED_PREDICTION) {
    return {
      event: NDB2WebhookEvent.RETIRED_PREDICTION,
      data: data as NDB2API.EnhancedPrediction,
    };
  }

  if (event_name === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    return {
      event: NDB2WebhookEvent.TRIGGERED_PREDICTION,
      data: data as NDB2API.EnhancedPrediction,
    };
  }

  if (event_name === NDB2WebhookEvent.NEW_VOTE) {
    return {
      event: NDB2WebhookEvent.NEW_VOTE,
      data: data as NDB2API.EnhancedPrediction,
    };
  }

  if (event_name === NDB2WebhookEvent.JUDGED_PREDICTION) {
    return {
      event: NDB2WebhookEvent.JUDGED_PREDICTION,
      data: data as NDB2API.EnhancedPrediction,
    };
  }

  if (event_name === NDB2WebhookEvent.SEASON_START) {
    return {
      event: NDB2WebhookEvent.SEASON_START,
      data: data as NDB2API.Season,
    };
  }

  if (event_name === NDB2WebhookEvent.SEASON_END) {
    return {
      event: NDB2WebhookEvent.SEASON_END,
      data: data as NDB2API.SeasonResults,
    };
  }

  throw new Error("Invalid webhook event name");
};
