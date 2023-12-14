/* Replace with your SQL commands */
BEGIN;

CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id int NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    events_new BOOLEAN NOT NULL DEFAULT FALSE,
    events_pre INT,
    events_forum_thread BOOLEAN NOT NULL DEFAULT FALSE,
    events_exclusions_starlink BOOLEAN NOT NULL DEFAULT FALSE,
    events_exclusions_unknown_chinese BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_new BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_prediction_closed BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_bet_closed BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_prediction_judged BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_bet_judged BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_bet_retired BOOLEAN NOT NULL DEFAULT FALSE,
    ndb_season_end BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO user_notifications (user_id, events_new, events_pre)
  SELECT id, new_event, pre_notification FROM users;

COMMIT;