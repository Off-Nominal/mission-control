"use strict";

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.createTable("ndb2_msg_subscriptions", {
    id: { type: "int", primaryKey: true, autoIncrement: true, notNull: true },
    prediction_id: { type: "int", notNull: true },
    type: { type: "string", notNull: true },
    channel_id: { type: "string", notNull: true },
    message_id: "string",
    expiry: "timestamp",
  });
};

exports.down = function (db) {
  return db.dropTable("ndb2_msg_subscriptions");
};

exports._meta = {
  version: 1,
};
