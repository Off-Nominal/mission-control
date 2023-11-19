import { Client } from "pg";
import db from "../providers/db";

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

export const addSubscription = (
  type: Ndb2MsgSubscriptionType,
  prediction_id: number,
  channel_id: string,
  message_id: string | null = null,
  expiry: Date | null = null
): Promise<number> => {
  return db
    .query<{ id: number }>(
      "INSERT INTO ndb2_msg_subscriptions (type, prediction_id, channel_id, message_id, expiry) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
      [type, prediction_id, channel_id, message_id, expiry]
    )
    .then((response) => {
      const { id } = response.rows[0];
      return id;
    });
};

export const fetchActiveSubs = (
  prediction_id: number
): Promise<Ndb2MsgSubscription[]> => {
  return db
    .query<Ndb2MsgSubscription>(
      "SELECT id, type, prediction_id, channel_id, message_id, expiry FROM ndb2_msg_subscriptions WHERE prediction_id = $1 AND expiry > NOW() ORDER BY id DESC",
      [prediction_id]
    )
    .then((response) => response.rows);
};

export const fetchSubByType = (
  prediction_id: number,
  type: Ndb2MsgSubscriptionType
): Promise<Ndb2MsgSubscription[]> => {
  return db
    .query<Ndb2MsgSubscription>(
      "SELECT id, type, prediction_id, channel_id, message_id, expiry FROM ndb2_msg_subscriptions WHERE prediction_id = $1 AND type = $2 ORDER BY id DESC LIMIT 1 ",
      [prediction_id, type]
    )
    .then((response) => response.rows);
};

export const deleteSubById = async (subId: number): Promise<boolean> => {
  return db
    .query("DELETE FROM ndb2_msg_subscriptions WHERE id = $1", [subId])
    .then((response) => true);
};
