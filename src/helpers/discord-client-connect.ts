import { Status, type Client } from "discord.js";
import {
  type DiscordBotLabel,
  getDiscordBootStatus,
  registerDiscordBootClient,
  setDiscordBotStatus,
} from "./discord-boot-status";
import {
  discordSessionRateLimitDelayMs,
  isDiscordSessionRateLimitError,
} from "./discord-session-rate-limit";

export { getDiscordBootStatus } from "./discord-boot-status";
export type {
  DiscordBotLabel,
  DiscordBotStatus,
} from "./discord-boot-status";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stopConnect = new WeakMap<Client, boolean>();

const SESSION_RESET_AT_RE =
  /resets at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/i;

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

export type DiscordBotConnectConfig = {
  client: Client;
  token: string;
  label: DiscordBotLabel;
};

export async function connectDiscordClient(
  client: Client,
  token: string,
  label: DiscordBotLabel,
): Promise<void> {
  registerDiscordBootClient(label, client);
  stopConnect.set(client, false);

  if (client.isReady()) {
    setDiscordBotStatus(label, { status: "connected" });
    console.log(`[Discord/${label}] Gateway already connected`);
    return;
  }

  let attempt = 0;

  while (!client.isReady() && !stopConnect.get(client)) {
    attempt += 1;

    try {
      if (attempt === 1) {
        console.log(`[Discord/${label}] Connecting…`);
      } else {
        console.log(
          `[Discord/${label}] Retrying gateway connection (attempt ${attempt})…`,
        );
      }

      setDiscordBotStatus(label, { status: "connecting" });

      if (isDiscordClientConnecting(client)) {
        await waitForClientReady(client);
        continue;
      }

      await client.login(token);
      await waitForClientReady(client);
      setDiscordBotStatus(label, { status: "connected" });
      console.log(`[Discord/${label}] Gateway connected`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const rateLimitDelayMs = discordSessionRateLimitDelayMs(err);
      const delayMs =
        rateLimitDelayMs ??
        Math.min(1_000 * 2 ** Math.min(attempt, 5), 30_000);

      if (isDiscordSessionRateLimitError(err)) {
        const retryAt =
          err instanceof Error
            ? err.message.match(SESSION_RESET_AT_RE)?.[1]
            : undefined;

        setDiscordBotStatus(label, {
          status: "rate_limited",
          message,
          retryAt,
          retryInSec: Math.ceil(delayMs / 1_000),
        });

        console.error(
          `[Discord/${label}] SESSION RATE LIMITED — /health returns 503 (Coolify can alert)`,
        );
        console.error(
          `[Discord/${label}] Retrying in ${Math.ceil(delayMs / 1_000)}s: ${message}`,
        );
      } else {
        setDiscordBotStatus(label, {
          status: "failed",
          message,
          retryInSec: Math.ceil(delayMs / 1_000),
        });
        console.error(
          `[Discord/${label}] Login failed; retrying in ${Math.ceil(delayMs / 1_000)}s: ${message}`,
        );
      }

      await sleep(delayMs);
    }
  }

  if (stopConnect.get(client)) {
    throw new Error(`[Discord/${label}] Gateway connect stopped`);
  }
}

export async function connectAllDiscordBots(
  configs: DiscordBotConnectConfig[],
): Promise<void> {
  console.log(
    "[Boot] Waiting for all Discord gateway clients (required dependency)…",
  );

  await Promise.all(
    configs.map(({ client, token, label }) =>
      connectDiscordClient(client, token, label),
    ),
  );

  console.log("[Boot] All Discord gateway clients connected");
}

export function stopDiscordClientConnect(client: Client): void {
  stopConnect.set(client, true);
}

export function isDiscordClientReady(client: Client): boolean {
  return client.isReady();
}
