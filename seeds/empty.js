const dotenv = require("dotenv");
dotenv.config();

const empty = (db) => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  return db.query(`TRUNCATE users, ndb2_msg_subscriptions;`);
};

module.exports = empty;
