import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSkipAccessLog } from "./access-log";

describe("access log", () => {
  it("skips a successful health or ready probe", () => {
    assert.equal(shouldSkipAccessLog("/health", 200), true);
    assert.equal(shouldSkipAccessLog("/health?watch=1", 200), true);
    assert.equal(shouldSkipAccessLog("/ready", 200), true);
  });

  it("skips scanner 404s", () => {
    assert.equal(shouldSkipAccessLog("/wp-content/plugins/hellopress/wp_filemanager.php", 404), true);
    assert.equal(shouldSkipAccessLog("/fling.php?p=", 404), true);
    assert.equal(shouldSkipAccessLog("/", 404), true);
    assert.equal(shouldSkipAccessLog("/nope", 404), true);
  });

  it("logs a failed probe and any other request", () => {
    assert.equal(shouldSkipAccessLog("/health", 500), false);
    assert.equal(shouldSkipAccessLog("/ready", 503), false);
    assert.equal(shouldSkipAccessLog("/commands", 200), false);
  });
});
