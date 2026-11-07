import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSkipHealthAccessLog } from "./access-log";

describe("health access log", () => {
  it("skips a successful health or ready probe", () => {
    assert.equal(shouldSkipHealthAccessLog("/health", 200), true);
    assert.equal(shouldSkipHealthAccessLog("/health?watch=1", 200), true);
    assert.equal(shouldSkipHealthAccessLog("/ready", 200), true);
  });

  it("logs a failed probe and any other request", () => {
    assert.equal(shouldSkipHealthAccessLog("/health", 500), false);
    assert.equal(shouldSkipHealthAccessLog("/ready", 503), false);
    assert.equal(shouldSkipHealthAccessLog("/commands", 200), false);
    assert.equal(shouldSkipHealthAccessLog("/nope", 404), false);
  });
});
