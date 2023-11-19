import db from "..";

type User = {
  id: number;
  discord_id: string;
  new_event: boolean;
  pre_notification: number | null;
};

export const setEventSubscriptions = async (
  discord_id: string,
  newEvent: boolean | null | undefined,
  preEvent: number | null | undefined
) => {
  const subscribeSet = newEvent !== undefined;
  const preEventSet = preEvent !== undefined;

  const userQuery = await db.query<User>(
    "SELECT * FROM users WHERE discord_id = $1",
    [discord_id]
  );

  const user = userQuery.rows[0];

  if (!user) {
    return db.query<User>(
      "INSERT INTO users (discord_id, new_event, pre_notification) VALUES ($1, $2, $3) RETURNING *",
      [discord_id, subscribeSet ? newEvent || false : false, preEvent || null]
    );
  }

  return db.query<User>(
    "UPDATE users SET new_event = $1, pre_notification = $2 WHERE discord_id = $3 RETURNING *",
    [
      subscribeSet ? newEvent || false : user.new_event,
      preEventSet ? preEvent : user.pre_notification,
      discord_id,
    ]
  );
};

export const fetchNewEventSubscribers = async () => {
  return await db.query<User>(
    "SELECT discord_id FROM users WHERE new_event = true"
  );
};

export const fetchPreNotificationSubscribers = async () => {
  return await db.query<User>(
    "SELECT discord_id, pre_notification FROM users WHERE pre_notification IS NOT NULL"
  );
};
