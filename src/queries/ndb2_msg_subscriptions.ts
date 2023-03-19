import { Client } from "pg";

export enum Ndb2MsgSubscriptionType {
  CONTEXT = "context",
  VIEW = "view",
}

export type Ndb2MsgSubscription = {
  id: number;
  type: Ndb2MsgSubscriptionType;
  prediction_id: number;
  channel_id: string;
  message_id: string;
  expiry: string | null;
};

export default function ndb2MsgSubscriptionQueries(db: Client) {
  const addSubscription = async (
    type: Ndb2MsgSubscriptionType,
    prediction_id: number,
    channel_id: string,
    message_id: string,
    expiry: Date | null = null
  ) => {
    return await db.query(
      "INSERT INTO ndb2_msg_subscriptions (type, prediction_id, channel_id, message_id, expiry) VALUES ($1, $2, $3, $4, $5);",
      [type, prediction_id, channel_id, message_id, expiry]
    );
  };

  const fetchSubs = async (prediction_id: number) => {
    return await db
      .query<Ndb2MsgSubscription>(
        "SELECT id, type, prediction_id, channel_id, message_id, expiry FROM ndb2_msg_subscriptions WHERE prediction_id = $1",
        [prediction_id]
      )
      .then((response) => response.rows);
  };

  return {
    fetchSubs,
    addSubscription,
  };
}
