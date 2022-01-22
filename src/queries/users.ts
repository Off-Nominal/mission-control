import { Client } from "pg";

type User = {
  id: number;
  discord_id: string;
  auto_subscribe: boolean;
  pre_notification: number | null;
};

export const setEventSubscriptions = async (
  db: Client,
  discord_id: string,
  subscribe: boolean | null,
  preEvent: number | null
) => {
  const subscribeSet = subscribe !== null;
  const preEventSet = preEvent !== null;

  const userQuery = await db.query<User>(
    "SELECT * FROM users WHERE discord_id = $1",
    [discord_id]
  );

  const user = userQuery.rows[0];

  if (!user) {
    return db.query<User>(
      "INSERT INTO users (discord_id, auto_subscribe, pre_notification) VALUES ($1, $2, $3) RETURNING *",
      [
        discord_id,
        subscribeSet ? subscribe : false,
        preEventSet ? preEvent : null,
      ]
    );
  }

  return db.query<User>(
    "UPDATE users SET auto_subscribe = $1, pre_notification = $2 WHERE discord_id = $3 RETURNING *",
    [
      subscribeSet ? subscribe : user.auto_subscribe,
      preEventSet ? preEvent : user.pre_notification,
      discord_id,
    ]
  );
};
