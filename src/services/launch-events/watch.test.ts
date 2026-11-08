import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { watchLaunches } from "./watch";

describe("launch watcher", () => {
  it("subscribes before start so the first ready event syncs", () => {
    const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    const calls: string[] = [];
    const watcher = {
      on(event: string, listener: (...args: unknown[]) => void) {
        calls.push(`on:${event}`);
        const list = listeners.get(event) ?? [];
        list.push(listener);
        listeners.set(event, list);
      },
      once(event: string, listener: (...args: unknown[]) => void) {
        calls.push(`once:${event}`);
        this.on(event, listener);
      },
      start() {
        calls.push("start");
        for (const listener of listeners.get("ready") ?? []) listener();
      },
    };
    const seen: string[] = [];

    watchLaunches(
      watcher,
      (eventType) => seen.push(eventType),
      () => seen.push("init_error"),
    );

    assert.deepEqual(seen, ["ready"]);
    assert.ok(calls.indexOf("on:ready") < calls.indexOf("start"));
    assert.equal(calls[calls.length - 1], "start");
  });
});
