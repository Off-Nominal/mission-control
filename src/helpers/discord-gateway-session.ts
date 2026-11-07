import {
  DefaultWebSocketManagerOptions,
  WebSocketShard,
  type WebSocketShardDestroyOptions,
} from "@discordjs/ws";
import type { Client } from "discord.js";

/**
 * @discordjs/ws passes this reason when a gateway wait exceeds readyTimeout
 * (15s by default) and then identifies again. discord.js never overrides
 * that timeout, and the reconnect does not re-check the daily session budget.
 */
export const GATEWAY_WAIT_TIMEOUT_REASON =
  "Something timed out or went wrong while waiting for an event";

let installed = false;

export function withoutReidentify(
  options?: WebSocketShardDestroyOptions,
): WebSocketShardDestroyOptions | undefined {
  if (
    options?.reason === GATEWAY_WAIT_TIMEOUT_REASON &&
    options.recover !== undefined
  ) {
    return { code: options.code, reason: options.reason };
  }
  return options;
}

/**
 * A missed READY must not open another session.
 *
 * discord.js builds the gateway manager without readyTimeout, so the library
 * default of 15 seconds applies. On that timeout the shard closes and sends a
 * new Identify. Identify is what consumes the daily session budget, and this
 * path never consults session_start_limit again, so one slow READY drains all
 * 1,000 sessions inside a single login() call.
 */
export function installDiscordSessionGuard(): void {
  (DefaultWebSocketManagerOptions as { readyTimeout: number | null }).readyTimeout =
    null;

  if (installed) {
    return;
  }
  installed = true;

  const proto = WebSocketShard.prototype;
  const originalDestroy = proto.destroy;
  proto.destroy = function destroyWithoutReidentify(
    this: WebSocketShard,
    options?: WebSocketShardDestroyOptions,
  ) {
    const next = withoutReidentify(options);
    if (next !== options) {
      console.error(
        "[Discord] Gateway wait timed out. Closing this socket without another Identify.",
      );
    }
    return originalDestroy.call(this, next);
  };

  console.log(
    "[Discord] Gateway READY timeout disabled so a slow READY cannot open another session",
  );
}

/**
 * login() destroys the client when the gateway rejects the attempt, and
 * isReady() stays false afterwards. A later attempt has to clear that flag
 * or a successful reconnect is invisible to the boot loop.
 */
export function prepareClientForLogin(client: Client): void {
  installDiscordSessionGuard();
  (client.ws as unknown as { destroyed: boolean }).destroyed = false;
}
