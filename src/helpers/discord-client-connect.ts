import { Status, type Client } from "discord.js";
import {
  discordSessionRateLimitDelayMs,
  isDiscordSessionRateLimitError,
} from "./discord-session-rate-limit";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stopConnect = new WeakMap<Client, boolean>();
const connectLoopRunning = new WeakMap<Client, boolean>();
const hasConnected = new WeakMap<Client, boolean>();

function isDiscordClientConnecting(client: Client): boolean {
  const status = client.ws.status;
  return (
    status === Status.Connecting ||
    status === Status.Reconnecting ||
    status === Status.Identifying ||
    status === Status.Resuming ||
    status === Status.WaitingForGuilds ||
    status === Status.Nearly
  );
}

function waitForClientReady(
  client: Client,
  timeoutMs: number = 60_000,
): Promise<void> {
  if (client.isReady()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off("clientReady", onReady);
      reject(new Error("Timed out waiting for Discord clientReady"));
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timer);
      resolve();
    };

    client.once("clientReady", onReady);
  });
}

export function connectDiscordClientInBackground(
  client: Client,
  token: string,
  label: string,
): void {
  if (client.isReady() || connectLoopRunning.get(client) || hasConnected.get(client)) {
    return;
  }

  connectLoopRunning.set(client, true);
  stopConnect.set(client, false);

  void (async () => {
    let attempt = 0;

    try {
      while (!client.isReady() && !stopConnect.get(client)) {
        if (hasConnected.get(client)) {
          return;
        }

        attempt += 1;

        try {
          if (attempt === 1) {
            console.log(`[Discord/${label}] Connecting in background…`);
          } else {
            console.log(
              `[Discord/${label}] Retrying gateway connection (attempt ${attempt})…`,
            );
          }

          if (isDiscordClientConnecting(client)) {
            await waitForClientReady(client);
            continue;
          }

          await client.login(token);
          await waitForClientReady(client);
          hasConnected.set(client, true);
          console.log(`[Discord/${label}] Gateway connected`);
          return;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const rateLimitDelayMs = discordSessionRateLimitDelayMs(err);
          const delayMs =
            rateLimitDelayMs ??
            Math.min(1_000 * 2 ** Math.min(attempt, 5), 30_000);

          if (isDiscordSessionRateLimitError(err)) {
            console.error(
              `[Discord/${label}] Session rate limited; retrying in ${Math.ceil(delayMs / 1000)}s: ${message}`,
            );
          } else {
            console.error(`[Discord/${label}] Login failed: ${message}`);
          }

          await sleep(delayMs);
        }
      }
    } finally {
      connectLoopRunning.set(client, false);
    }
  })();
}

export function stopDiscordClientConnect(client: Client): void {
  stopConnect.set(client, true);
}

export function isDiscordClientReady(client: Client): boolean {
  return client.isReady();
}
