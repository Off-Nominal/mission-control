import { Client } from "pg";
import { API } from "./types";
import { isBefore, sub } from "date-fns";

export class UserNotifications {
  private cache: {
    fetchPreNotificationSubscribers: {
      timestamp: Date;
      data: API.UserNotification.FetchPreNotificationSubscribers[];
      isFresh: () => boolean;
    };
  } = {
    fetchPreNotificationSubscribers: {
      timestamp: null,
      data: null,
      isFresh: () => {
        if (!this.cache.fetchPreNotificationSubscribers.timestamp) {
          return false;
        }

        const now = new Date();
        return isBefore(
          this.cache.fetchPreNotificationSubscribers.timestamp,
          sub(now, { minutes: 2 })
        );
      },
    },
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

  public fetchNewEventSubscribers = async (): Promise<
    API.UserNotification.FetchNewEventSubscribers[]
  > => {
    return await this.db
      .query<API.UserNotification.FetchNewEventSubscribers>(
        `SELECT 
            u.discord_id 
          FROM user_notifications un
          JOIN users u ON u.id = un.user_id
          WHERE un.events_new IS TRUE`
      )
      .then((res) => res.rows);
  };

  public fetchPreNotificationSubscribers = (): Promise<
    API.UserNotification.FetchPreNotificationSubscribers[]
  > => {
    if (this.cache.fetchPreNotificationSubscribers.isFresh()) {
      return Promise.resolve(this.cache.fetchPreNotificationSubscribers.data);
    }

    return this.db
      .query<API.UserNotification.FetchPreNotificationSubscribers>(
        `SELECT 
            u.discord_id, 
            un.events_pre 
          FROM user_notifications un 
          JOIN users u ON un.user_id = u.id
          WHERE events_pre IS NOT NULL`
      )
      .then((result) => {
        this.cache.fetchPreNotificationSubscribers.timestamp = new Date();
        this.cache.fetchPreNotificationSubscribers.data = result.rows;
        return result.rows;
      });
  };
}
