export namespace API {
  export namespace User {
    export type Base = {
      id: number;
      discord_id: string;
    };
  }

  export namespace UserNotification {
    export type BaseSettings = {
      events_new: boolean;
      events_pre: number | null;
      events_forum_thread: boolean;
      events_exclusions_starlink: boolean;
      events_exclusions_unknown_china: boolean;
      ndb_new: boolean;
      ndb_prediction_closed: boolean;
      ndb_bet_closed: boolean;
      ndb_prediction_judged: boolean;
      ndb_bet_judged: boolean;
      ndb_bet_retired: boolean;
      ndb_season_end: boolean;
    };

    export type Base = {
      id: number;
      user_id: number;
      updated_at: string;
    } & BaseSettings;

    const baseSettings: BaseSettings = {
      events_new: false,
      events_pre: null,
      events_forum_thread: false,
      events_exclusions_starlink: false,
      events_exclusions_unknown_china: false,
      ndb_new: false,
      ndb_prediction_closed: false,
      ndb_bet_closed: false,
      ndb_prediction_judged: false,
      ndb_bet_judged: false,
      ndb_bet_retired: false,
      ndb_season_end: false,
    };

    export type FetchSettingsByDiscordId = Base;

    export type SetNotification = boolean;

    export type FetchNewEventSubscribers = {
      discord_id: string;
    }[];

    export type FetchPreNotificationSubscribers = {
      discord_id: string;
      pre_notification: number;
    };

    export const isUserNotification = (
      setting: string
    ): setting is keyof BaseSettings => {
      return setting in baseSettings;
      return true;
    };
  }

  export enum Ndb2MsgSubscriptionType {
    CONTEXT = "context",
    VIEW = "view",
    RETIREMENT = "retirement",
    TRIGGER_NOTICE = "trigger_notice",
    JUDGEMENT_NOTICE = "judgement_notice",
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
