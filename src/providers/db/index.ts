import mcconfig from "../../mcconfig";
import { Client } from "pg";

const db = new Client({
  connectionString: mcconfig.database.url,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default db;
