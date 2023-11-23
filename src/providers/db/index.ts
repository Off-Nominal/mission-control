import mcconfig from "../../mcconfig";
import { Client } from "pg";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import { User } from "./models/User";
import { Test } from "./models/Test";

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
const user = new User(db);

export const models = {
  user,
  test,
};
