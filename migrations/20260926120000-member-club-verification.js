"use strict";

var dbm;
var type;
var seed;

exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE member_club_verification (
      discord_user_id text PRIMARY KEY NOT NULL,
      last_verified_at timestamptz NOT NULL
    )
  `);
};

exports.down = function (db) {
  return db.runSql("DROP TABLE member_club_verification");
};

exports._meta = {
  version: 1,
};
