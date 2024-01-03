export namespace API {
  export namespace User {
    export type Base = {
      id: number;
      discord_id: string;
    };
  }

  export namespace UserNotification {
    export type EventNotificationSettings = {
      events_new: boolean;
      events_pre: number | null;
      events_forum_thread: boolean;
      events_exclusions_starlink: boolean;
      events_exclusions_unknown_china: boolean;
    };

    export type NDBNotificationSettings = {
      ndb_new: boolean;
      ndb_prediction_closed: boolean;
      ndb_bet_closed: boolean;
      ndb_prediction_judged: boolean;
      ndb_bet_judged: boolean;
      ndb_bet_retired: boolean;
      ndb_season_end: boolean;
    };

    export type BaseSettings = EventNotificationSettings &
      NDBNotificationSettings;

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

    type Subscriber = {
      discord_id: string;
    };

    export type FetchNewEventSubscribers = Subscriber;
    export type FetchForumThreadSubscribers = Subscriber;
    export type FetchPreNotificationSubscribers = Subscriber & {
      events_pre: number;
    };
    export type FetchNewPredictionSubscribers = Subscriber;
    export type IsOwnPredictionClosedSubscribed = { exists: boolean };
    export type FetchOwnBetClosedSubscribers = Subscriber;
    export type FetchOwnPredictionJudgedSubscribers = Subscriber;
    export type FetchOwnBetJudgedSubscribers = Subscriber;
    export type FetchOwnBetRetiredSubscribers = Subscriber;
    export type FetchSeasonEndSubscribers = Subscriber;

    export const isUserNotification = (
      setting: string
    ): setting is keyof BaseSettings => {
      return setting in baseSettings;
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
