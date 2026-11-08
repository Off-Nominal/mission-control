import mcconfig from "../../mcconfig";
import { Client } from "pg";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import { User } from "./models/User";
import { Test } from "./models/Test";
import { Ndb2MsgSubscription } from "./models/Ndb2MsgSubscription";
import { createResilientDatabase } from "./database";

const db = createResilientDatabase({
  open: () =>
    new Client({
      connectionString: mcconfig.database.url,
    }),
  connect: (client) => client.connect(),
  onDisconnect: (err) => {
    console.error("[db] Postgres connection lost:", err.message);
  },
});

export function connectDatabase(): Promise<void> {
  return db
    .query("SELECT 1")
    .then(() => {
      bootLogger.addLog(LogStatus.SUCCESS, "Database connected");
      bootLogger.logItemSuccess("db");
    })
    .catch((err) => {
      console.error(err);
      bootLogger.addLog(LogStatus.FAILURE, "Failure to connect to Database");
      throw err;
    });
}

// Models
const test = new Test(db);
const user = new User(db);
const ndb2MsgSubscription = new Ndb2MsgSubscription(db);

export const models = {
  user,
  test,
  ndb2MsgSubscription,
};
