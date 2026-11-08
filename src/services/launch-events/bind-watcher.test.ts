import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EventEmitter } from "events";
import { bindLaunchWatcher } from "./bind-watcher";

describe("launch watcher binding", () => {
  it("syncs immediately when the first payload already arrived", () => {
    const watcher = new EventEmitter();
    const seen: string[] = [];

    bindLaunchWatcher(watcher, (eventType) => seen.push(eventType), true);

    assert.deepEqual(seen, ["ready"]);
    watcher.emit("ready");
    watcher.emit("new");
    watcher.emit("change");
    assert.deepEqual(seen, ["ready", "new", "change"]);
  });

  it("waits for ready when the watcher has not finished its first fetch", () => {
    const watcher = new EventEmitter();
    const seen: string[] = [];

    bindLaunchWatcher(watcher, (eventType) => seen.push(eventType), false);

    assert.deepEqual(seen, []);
    watcher.emit("ready");
    watcher.emit("ready");
    assert.deepEqual(seen, ["ready"]);
  });
});
