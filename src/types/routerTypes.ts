export enum NDB2WebhookEvent {
  NEW_PREDICTION = "new_prediction",
  NEW_BET = "new_bet",
  RETIRED_PREDICTION = "retired_prediction",
  TRIGGERED_PREDICTION = "triggered_prediction",
  NEW_VOTE = "new_vote",
  JUDGED_PREDICTION = "judged_prediction",
  SEASON_START = "season_start",
}

export const isNdb2WebhookEvent = (event: any): event is NDB2WebhookEvent => {
  if (typeof event !== "string") {
    return false;
  }

  return Object.values(NDB2WebhookEvent).includes(event as NDB2WebhookEvent);
};
