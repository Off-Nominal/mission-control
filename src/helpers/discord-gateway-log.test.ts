import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCloseCode,
  formatRetryDelay,
  formatSessionStartLimit,
  interpretGatewayDebug,
  isGatewayAlarm,
} from "./discord-gateway-log";

describe("discord gateway log", () => {
  it("keeps identify, resume, and close details on one line", () => {
    const identify = interpretGatewayDebug(
      [
        "[WS => Shard 0] Identifying",
        "shard id: 0",
        "shard count: 1",
        "intents: 4609",
        "compression: none",
      ].join("\n\t"),
    );
    assert.equal(identify?.kind, "identify");
    assert.equal(
      identify?.line,
      "[WS => Shard 0] Identifying | shard id: 0 | shard count: 1 | intents: 4609 | compression: none",
    );

    const destroy = interpretGatewayDebug(
      [
        "[WS => Shard 0] Destroying shard",
        "Reason: Got disconnected by Discord",
        "Code: 1000",
        "Recover: Reconnect",
      ].join("\n\t"),
    );
    assert.equal(destroy?.kind, "destroy");
    assert.equal(isGatewayAlarm(destroy?.line ?? ""), true);

    const resume = interpretGatewayDebug(
      [
        "[WS => Shard 0] Resuming session",
        "sequence: 42",
        "shard id: 0",
      ].join("\n\t"),
    );
    assert.equal(resume?.kind, "info");
    assert.equal(isGatewayAlarm(resume?.line ?? ""), false);
  });

  it("drops heartbeat noise and stack traces from a destroyed manager", () => {
    assert.equal(
      interpretGatewayDebug(
        "[WS => Shard 0] Heartbeat acknowledged, latency of 42ms.",
      ),
      null,
    );
    assert.equal(
      interpretGatewayDebug(
        "[WS => Shard 0] Was about to hit the send rate limit, sleeping for 20ms",
      ),
      null,
    );
    const destroyed = interpretGatewayDebug(
      "[WS => Manager] Manager was destroyed:\nError: Manager was destroyed\n    at WebSocketManager.destroy",
    );
    assert.equal(destroyed?.line, "[WS => Manager] Manager was destroyed");
  });

  it("records the session window and whether the remaining count is stale", () => {
    const now = Date.parse("2026-11-07T13:29:24.000Z");
    const line = formatSessionStartLimit(
      {
        shards: 1,
        session_start_limit: {
          total: 1000,
          remaining: 0,
          reset_after: 67_550_000,
          max_concurrency: 1,
        },
      },
      true,
      now,
    );
    assert.match(line, /remaining=0/);
    assert.match(line, /total=1000/);
    assert.match(line, /reset_at=2026-11-08T08:15:14.000Z/);
    assert.match(line, /max_concurrency=1/);
    assert.match(line, /cached=true/);
  });

  it("names the close codes that spend or end a session", () => {
    assert.equal(formatCloseCode(4008), "4008 Rate limited");
    assert.equal(formatCloseCode(4009), "4009 Session timed out");
    assert.equal(formatCloseCode(4014), "4014 Disallowed intent");
    assert.equal(formatCloseCode(1006), "1006 Abnormal closure");
    assert.equal(formatRetryDelay(67_550_000), "67550s (18h 45m)");
  });
});
