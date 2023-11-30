import { Client } from "pg";
import { API } from "./types";

export class User {
  private db: Client;

  constructor(db: Client) {
    this.db = db;
  }

  public setEventSubscriptions = async (
    discord_id: string,
    newEvent: boolean | null | undefined,
    preEvent: number | null | undefined
  ) => {
    const subscribeSet = newEvent !== undefined;
    const preEventSet = preEvent !== undefined;

    const userQuery = await this.db.query<API.User>(
      "SELECT * FROM users WHERE discord_id = $1",
      [discord_id]
    );

    const user = userQuery.rows[0];

    if (!user) {
      return this.db.query<API.User>(
        "INSERT INTO users (discord_id, new_event, pre_notification) VALUES ($1, $2, $3) RETURNING *",
        [discord_id, subscribeSet ? newEvent || false : false, preEvent || null]
      );
    }

    return this.db.query<API.User>(
      "UPDATE users SET new_event = $1, pre_notification = $2 WHERE discord_id = $3 RETURNING *",
      [
        subscribeSet ? newEvent || false : user.new_event,
        preEventSet ? preEvent : user.pre_notification,
        discord_id,
      ]
    );
  };

  public fetchNewEventSubscribers = async () => {
    return await this.db.query<API.User>(
      "SELECT discord_id FROM users WHERE new_event = true"
    );
  };

  public fetchPreNotificationSubscribers = async () => {
    return await this.db.query<API.User>(
      "SELECT discord_id, pre_notification FROM users WHERE pre_notification IS NOT NULL"
    );
  };
}
