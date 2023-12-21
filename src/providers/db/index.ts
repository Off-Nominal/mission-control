import mcconfig from "../../mcconfig";
import { Client } from "pg";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import { Test } from "./models/Test";
import { Ndb2MsgSubscription } from "./models/Ndb2MsgSubscription";
import { UserNotifications } from "./models/UserNotifications";

const db = new Client({
  connectionString: mcconfig.database.url,
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect()
  .then(() => {
    bootLogger.addLog(LogStatus.SUCCESS, "Database connected");
    bootLogger.logItemSuccess("db");
  })
  .catch((err) => {
    console.error(err);
    bootLogger.addLog(LogStatus.FAILURE, "Failure to connect to Database");
  });

// Models
const test = new Test(db);
const userNotifications = new UserNotifications(db);
const ndb2MsgSubscription = new Ndb2MsgSubscription(db);

export const models = {
  userNotifications,
  test,
  ndb2MsgSubscription,
};
