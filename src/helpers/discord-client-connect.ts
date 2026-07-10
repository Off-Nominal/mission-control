import type { Client } from "discord.js";
import {
  discordSessionRateLimitDelayMs,
  isDiscordSessionRateLimitError,
} from "./discord-session-rate-limit";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stopConnect = new WeakMap<Client, boolean>();

export function connectDiscordClientInBackground(
  client: Client,
  token: string,
  label: string,
): void {
  stopConnect.set(client, false);
  void (async () => {
    let attempt = 0;
    while (!client.isReady() && !stopConnect.get(client)) {
      attempt += 1;
      try {
        if (attempt === 1) {
          console.log(`[Discord/${label}] Connecting in background…`);
        } else {
          console.log(`[Discord/${label}] Retrying gateway connection (attempt ${attempt})…`);
        }
        await client.login(token);
        console.log(`[Discord/${label}] Gateway connected`);
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const rateLimitDelayMs = discordSessionRateLimitDelayMs(err);
        const delayMs = rateLimitDelayMs ?? Math.min(1_000 * 2 ** Math.min(attempt, 5), 30_000);
        if (isDiscordSessionRateLimitError(err)) {
          console.error(`[Discord/${label}] Session rate limited; retrying in ${Math.ceil(delayMs / 1000)}s: ${message}`);
        } else {
          console.error(`[Discord/${label}] Login failed: ${message}`);
        }
        await sleep(delayMs);
      }
    }
  })();
}

export function stopDiscordClientConnect(client: Client): void {
  stopConnect.set(client, true);
}

export function isDiscordClientReady(client: Client): boolean {
  return client.isReady();
}
