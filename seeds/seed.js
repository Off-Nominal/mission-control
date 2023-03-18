const pg = require("pg");
const empty = require("./empty");
const dotenv = require("dotenv");
dotenv.config();

const db = new pg.Client();
db.connect();

const seed = () => {
  if (process.env.NODE_ENV === "production") {
    return console.error("Cannot run seeding in production.");
  }

  empty(db).then(() => {
    db.end();
  });
};

seed();
