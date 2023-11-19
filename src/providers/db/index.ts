import { Client } from "pg";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";

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

export default db;
