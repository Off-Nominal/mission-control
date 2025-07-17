import { Client } from "pg";
import { API } from "./types";

export class Ndb2MsgSubscription {
  private db: Client;
  constructor(db: Client) {
    this.db = db;
  }

  public addSubscription = (
    type: API.Ndb2MsgSubscriptionType,
    prediction_id: number,
    channel_id: string,
    message_id: string | null = null,
    expiry: Date | null = null
  ): Promise<number> => {
    return this.db
      .query<{ id: number }>(
        "INSERT INTO ndb2_msg_subscriptions (type, prediction_id, channel_id, message_id, expiry) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
        [type, prediction_id, channel_id, message_id, expiry]
      )
      .then((response) => {
        const { id } = response.rows[0];
        return id;
      });
  };

  public fetchActiveSubs = (
    prediction_id: number
  ): Promise<API.Ndb2MsgSubscription[]> => {
    return this.db
      .query<API.Ndb2MsgSubscription>(
        "SELECT id, type, prediction_id, channel_id, message_id, expiry FROM ndb2_msg_subscriptions WHERE prediction_id = $1 AND (expiry > NOW() OR expiry IS NULL) ORDER BY id DESC",
        [prediction_id]
      )
      .then((response) => response.rows);
  };

  public fetchSubByType = (
    prediction_id: number,
    type: API.Ndb2MsgSubscriptionType
  ): Promise<API.Ndb2MsgSubscription[]> => {
    return this.db
      .query<API.Ndb2MsgSubscription>(
        "SELECT id, type, prediction_id, channel_id, message_id, expiry FROM ndb2_msg_subscriptions WHERE prediction_id = $1 AND type = $2 ORDER BY id DESC LIMIT 1 ",
        [prediction_id, type]
      )
      .then((response) => response.rows);
  };

  public deleteSubById = async (subId: number): Promise<boolean> => {
    return this.db
      .query("DELETE FROM ndb2_msg_subscriptions WHERE id = $1", [subId])
      .then((response) => true);
  };

  public expireSubById = async (subId: number): Promise<boolean> => {
    return this.db
      .query("UPDATE ndb2_msg_subscriptions SET expiry = NOW() WHERE id = $1", [
        subId,
      ])
      .then((response) => true);
  };
}
