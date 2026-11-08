import { Database } from "../database";

export class Test {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async testDB() {
    return await this.db.query("SELECT NOW()");
  }
}
