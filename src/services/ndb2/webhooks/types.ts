export enum NDB2WebhookEvent {
  NEW_PREDICTION = "new_prediction",
  RETIRED_PREDICTION = "retired_prediction",
  NEW_BET = "new_bet",
  TRIGGERED_PREDICTION = "triggered_prediction",
  TRIGGERED_SNOOZE = "triggered_snooze_check",
  NEW_VOTE = "new_vote",
  JUDGED_PREDICTION = "judged_prediction",
  NEW_SNOOZE_CHECK = "new_snooze_check",
  NEW_SNOOZE_VOTE = "new_snooze_vote",
  SNOOZED_PREDICTION = "snoozed_prediction",
  PREDICTION_EDIT = "prediction_edit",
  SEASON_START = "season_start",
  SEASON_END = "season_end",
}

export const isNdb2WebhookEvent = (event: any): event is NDB2WebhookEvent => {
  if (typeof event !== "string") {
    return false;
  }

  return Object.values(NDB2WebhookEvent).includes(event as NDB2WebhookEvent);
};
