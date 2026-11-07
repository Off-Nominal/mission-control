import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DefaultWebSocketManagerOptions,
  WebSocketShardDestroyRecovery,
} from "@discordjs/ws";
import {
  GATEWAY_WAIT_TIMEOUT_REASON,
  installDiscordSessionGuard,
  prepareClientForLogin,
  withoutReidentify,
} from "./discord-gateway-session";

describe("discord session guard", () => {
  it("does not open another session when a gateway wait times out", () => {
    installDiscordSessionGuard();
    assert.equal(DefaultWebSocketManagerOptions.readyTimeout, null);

    const timedOut = withoutReidentify({
      code: 1000,
      reason: GATEWAY_WAIT_TIMEOUT_REASON,
      recover: WebSocketShardDestroyRecovery.Reconnect,
    });
    assert.equal(timedOut?.recover, undefined);
    assert.equal(timedOut?.reason, GATEWAY_WAIT_TIMEOUT_REASON);

    const resume = withoutReidentify({
      code: 4009,
      reason: "Session timed out.",
      recover: WebSocketShardDestroyRecovery.Resume,
    });
    assert.equal(resume?.recover, WebSocketShardDestroyRecovery.Resume);
  });

  it("clears the destroyed flag so a later login can become ready", () => {
    const client = {
      ws: { destroyed: true },
    };

    prepareClientForLogin(client as never);

    assert.equal(client.ws.destroyed, false);
  });
});
