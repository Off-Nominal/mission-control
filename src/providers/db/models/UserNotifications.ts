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
          sub(now, { minutes: 4 })
        );
      },
    },
  };

  constructor(private db: Client) {
    this.db = db;
  }

  // public setEventSubscriptions = async (
  //   discord_id: string,
  //   newEvent: boolean | null | undefined,
  //   preEvent: number | null | undefined
  // ) => {
  //   const subscribeSet = newEvent !== undefined;
  //   const preEventSet = preEvent !== undefined;

  //   const userQuery = await this.db.query<API.User>(
  //     "SELECT * FROM users WHERE discord_id = $1",
  //     [discord_id]
  //   );

  //   const user = userQuery.rows[0];

  //   if (!user) {
  //     return this.db.query<API.User>(
  //       "INSERT INTO users (discord_id, new_event, pre_notification) VALUES ($1, $2, $3) RETURNING *",
  //       [discord_id, subscribeSet ? newEvent || false : false, preEvent || null]
  //     );
  //   }

  //   return this.db.query<API.User>(
  //     "UPDATE users SET new_event = $1, pre_notification = $2 WHERE discord_id = $3 RETURNING *",
  //     [
  //       subscribeSet ? newEvent || false : user.new_event,
  //       preEventSet ? preEvent : user.pre_notification,
  //       discord_id,
  //     ]
  //   );
  // };

  public fetchSettingsByDiscordId = async (discordId: string) => {
    return await this.db
      .query<API.UserNotification.FetchSettingsByDiscordId>(
        `SELECT * FROM user_notifications WHERE user_id = (SELECT id FROM users WHERE discord_id = $1)`,
        [discordId]
      )
      .then((res) => res.rows[0]);
  };

  public fetchNewEventSubscribers = async () => {
    return await this.db.query<API.UserNotification.FetchNewEventSubscribers>(
      `SELECT 
          u.discord_id 
        FROM user_notifications un
        JOIN users u ON u.id = un.user_id
        WHERE un.events_new IS TRUE`
    );
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
            un.pre_notification 
          FROM user_notifications un 
          JOIN users u ON un.user_id = u.id
          WHERE pre_notification IS NOT NULL`
      )
      .then((result) => {
        this.cache.fetchPreNotificationSubscribers.timestamp = new Date();
        this.cache.fetchPreNotificationSubscribers.data = result.rows;
        return result.rows;
      });
  };
}
