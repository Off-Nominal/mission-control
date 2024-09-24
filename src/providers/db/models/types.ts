export namespace API {
  export type User = {
    id: number;
    discord_id: string;
    new_event: boolean;
    pre_notification: number | null;
  };

  export enum Ndb2MsgSubscriptionType {
    CONTEXT = "context",
    VIEW = "view",
    RETIREMENT = "retirement",
    TRIGGER_NOTICE = "trigger_notice",
    JUDGEMENT_NOTICE = "judgement_notice",
    SNOOZE_CHECK = "snooze_check",
  }

  export type Ndb2MsgSubscription = {
    id: number;
    type: Ndb2MsgSubscriptionType;
    prediction_id: number;
    channel_id: string;
    message_id: string;
    expiry: string | null;
  };
}
