import { Client } from "pg";
import { API } from "./types";
import { isAfter, sub } from "date-fns";

type EventNotificationOptions = {
  isStarlink: boolean;
  isUnknownChina: boolean;
};

class Cache<T> {
  constructor(
    public data: T,
    private timestamp: Date = new Date(),
    public expires: number = 2
  ) {}

  public isFresh() {
    const now = new Date();
    return isAfter(this.timestamp, sub(now, { minutes: this.expires }));
  }
}

export class UserNotifications {
  private cache: {
    fetchPreNotificationSubscribers: Record<
      string,
      Cache<Promise<API.UserNotification.FetchPreNotificationSubscribers[]>>
    >;
  } = {
    fetchPreNotificationSubscribers: {},
  };

  constructor(private db: Client) {
    this.db = db;
  }

  public setNotification = async (
    discordId: string,
    notification: { key: keyof API.UserNotification.BaseSettings; value: any }
  ): Promise<API.UserNotification.SetNotification> => {
    // prevent SQL Injection
    if (!API.UserNotification.isUserNotification(notification.key)) {
      throw new TypeError("Invalid key");
    }

    return await this.db
      .query(
        `UPDATE user_notifications SET ${notification.key} = $1 WHERE user_id = (SELECT id FROM users WHERE discord_id = $2)`,
        [notification.value, discordId]
      )
      .then((res) => true);
  };

  public fetchSettingsByDiscordId = async (
    discordId: string
  ): Promise<API.UserNotification.FetchSettingsByDiscordId> => {
    return await this.db
      .query<API.UserNotification.FetchSettingsByDiscordId>(
        `SELECT * FROM user_notifications WHERE user_id = (SELECT id FROM users WHERE discord_id = $1)`,
        [discordId]
      )
      .then((res) => res.rows[0]);
  };

  // Events

  public fetchNewEventSubscribers = async (
    options?: EventNotificationOptions
  ): Promise<API.UserNotification.FetchNewEventSubscribers[]> => {
    let query = `SELECT 
      u.discord_id 
    FROM user_notifications un
    JOIN users u ON u.id = un.user_id
    WHERE un.events_new IS TRUE`;

    if (options?.isStarlink) {
      query += " AND un.events_exclusions_starlink IS NOT TRUE";
    }

    if (options?.isUnknownChina) {
      query += " AND un.events_exclusions_unknown_china IS NOT TRUE";
    }

    return await this.db
      .query<API.UserNotification.FetchNewEventSubscribers>(query)
      .then((res) => res.rows);
  };

  public fetchPreNotificationSubscribers = (
    options?: EventNotificationOptions
  ): Promise<API.UserNotification.FetchPreNotificationSubscribers[]> => {
    const cacheKey = JSON.stringify(options);

    if (this.cache.fetchPreNotificationSubscribers[cacheKey]?.isFresh()) {
      return this.cache.fetchPreNotificationSubscribers[cacheKey].data;
    }

    let query = `SELECT 
      u.discord_id, 
      un.events_pre 
    FROM user_notifications un 
    JOIN users u ON un.user_id = u.id
    WHERE events_pre IS NOT NULL`;

    if (options?.isStarlink) {
      query += " AND un.events_exclusions_starlink IS NOT TRUE";
    }

    if (options?.isUnknownChina) {
      query += " AND un.events_exclusions_unknown_china IS NOT TRUE";
    }

    const promise = this.db
      .query<API.UserNotification.FetchPreNotificationSubscribers>(query)
      .then((result) => {
        return result.rows;
      });

    this.cache.fetchPreNotificationSubscribers[cacheKey] = new Cache(promise);

    return promise;
  };

  public fetchForumThreadSubscribers(
    options?: EventNotificationOptions
  ): Promise<API.UserNotification.FetchForumThreadSubscribers[]> {
    let query = `SELECT 
      u.discord_id 
    FROM user_notifications un
    JOIN users u ON u.id = un.user_id
    WHERE un.events_forum_thread IS TRUE`;

    if (options?.isStarlink) {
      query += " AND un.events_exclusions_starlink IS NOT TRUE";
    }

    if (options?.isUnknownChina) {
      query += " AND un.events_exclusions_unknown_china IS NOT TRUE";
    }
    return this.db
      .query<API.UserNotification.FetchForumThreadSubscribers>(query)
      .then((res) => res.rows);
  }

  public fetchNewPredictionSubscribers(options: {
    exclude: string;
  }): Promise<API.UserNotification.FetchNewPredictionSubscribers[]> {
    return this.db
      .query<API.UserNotification.FetchNewPredictionSubscribers>(
        `SELECT 
          u.discord_id 
        FROM user_notifications un
        JOIN users u ON u.id = un.user_id
        WHERE un.ndb_new IS TRUE AND u.discord_id != $1`,
        [options.exclude]
      )
      .then((res) => res.rows);
  }

  public fetchOwnPredictionClosedSubscribers(
    discordId: string
  ): Promise<boolean> {
    return this.db
      .query<API.UserNotification.IsOwnPredictionClosedSubscribed>(
        `SELECT EXISTS(
          SELECT
            u.discord_id
          FROM user_notifications un
          JOIN users u ON u.id = un.user_id
          WHERE un.ndb_prediction_closed IS TRUE AND u.discord_id = $1
        )`,
        [discordId]
      )
      .then((res) => res.rows[0].exists);
  }
}
