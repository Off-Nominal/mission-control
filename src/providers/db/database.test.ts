import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";
import { createResilientDatabase } from "./database";

class FakeClient extends EventEmitter {
  queryCount = 0;

  constructor(readonly id: number) {
    super();
  }

  query(queryText: string) {
    this.queryCount += 1;
    return Promise.resolve({ rows: [{ id: this.id, queryText }] });
  }
}

describe("database connection", () => {
  it("reuses the connected client", async () => {
    const opened: FakeClient[] = [];
    const db = createResilientDatabase({
      open: () => {
        const client = new FakeClient(opened.length + 1);
        opened.push(client);
        return client;
      },
      connect: async () => undefined,
    });

    const first = await db.query("SELECT 1");
    const second = await db.query("SELECT 2");

    assert.equal(opened.length, 1);
    assert.equal(first.rows[0].id, 1);
    assert.equal(second.rows[0].id, 1);
    assert.equal(opened[0].queryCount, 2);
  });

  it("opens a new client after the server drops the connection", async () => {
    const opened: FakeClient[] = [];
    const losses: string[] = [];
    const db = createResilientDatabase({
      open: () => {
        const client = new FakeClient(opened.length + 1);
        opened.push(client);
        return client;
      },
      connect: async () => undefined,
      onDisconnect: (err) => losses.push(err.message),
    });

    await db.query("SELECT 1");
    opened[0].emit("error", new Error("terminating connection due to administrator command"));
    const next = await db.query("SELECT 1");

    assert.equal(opened.length, 2);
    assert.equal(next.rows[0].id, 2);
    assert.deepEqual(losses, [
      "terminating connection due to administrator command",
    ]);
  });

  it("can try again after the first connection fails", async () => {
    let attempts = 0;
    const db = createResilientDatabase({
      open: () => new FakeClient(1),
      connect: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("database starting");
      },
    });

    await assert.rejects(db.query("SELECT 1"), /database starting/);
    const row = await db.query("SELECT 1");
    assert.equal(row.rows[0].id, 1);
    assert.equal(attempts, 2);
  });
});
