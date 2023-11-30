import { Client } from "pg";

export class Test {
  private db: Client;

  constructor(db: Client) {
    this.db = db;
  }

  async testDB() {
    return await this.db.query("SELECT NOW()");
  }
}
