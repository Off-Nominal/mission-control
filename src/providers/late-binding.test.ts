import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withLateBindings } from "./late-binding";

describe("late bindings", () => {
  it("reads a value assigned after the object is created", () => {
    let watcher: { id: string } | undefined;
    const providers = withLateBindings(
      { watcher },
      { watcher: () => watcher },
    );

    assert.equal(providers.watcher, undefined);
    watcher = { id: "live" };
    assert.equal(providers.watcher, watcher);
  });
});
