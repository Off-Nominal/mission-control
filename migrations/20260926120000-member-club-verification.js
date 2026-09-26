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
  return db.createTable("member_club_verification", {
    discord_user_id: {
      type: "string",
      primaryKey: true,
      notNull: true,
    },
    last_verified_at: {
      type: "timestamp",
      notNull: true,
    },
  });
};

exports.down = function (db) {
  return db.dropTable("member_club_verification");
};

exports._meta = {
  version: 1,
};
