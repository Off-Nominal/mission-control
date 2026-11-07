import type { Client } from "discord.js";
import mcconfig from "../mcconfig";
import {
  type DiscordBotLabel,
  registerDiscordBootClient,
  setDiscordBotStatus,
} from "./discord-boot-status";
import {
  attachDiscordGatewayLog,
  formatRetryDelay,
} from "./discord-gateway-log";
import {
  installDiscordSessionGuard,
  prepareClientForLogin,
} from "./discord-gateway-session";
import {
  discordSessionRateLimitDelayMs,
  isDiscordSessionRateLimitError,
} from "./discord-session-rate-limit";

installDiscordSessionGuard();

export { getAppHealth, getDiscordBootStatus } from "./discord-boot-status";
export type {
  AppHealth,
  AppHealthPhase,
  DiscordBotLabel,
  DiscordBotStatus,
} from "./discord-boot-status";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stopConnect = new WeakMap<Client, boolean>();

const SESSION_RESET_AT_RE =
  /resets at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/i;

export class DiscordBootFatalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscordBootFatalError";
  }
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

  const maxLoginAttempts = mcconfig.discord.boot.maxLoginAttempts;
  let attempt = 0;
  let nonRateLimitFailures = 0;

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

      // A failed login() leaves the client destroyed and the shard marked
      // connecting. Clear that and log in again, which sends one Identify.
      prepareClientForLogin(client);
      attachDiscordGatewayLog(client, token, label);
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
          `[Discord/${label}] SESSION RATE LIMITED — staying alive; /health reports alert (no container restart)`,
        );
        console.error(
          `[Discord/${label}] Retrying in ${formatRetryDelay(delayMs)}: ${message}`,
        );
      } else {
        nonRateLimitFailures += 1;
        setDiscordBotStatus(label, {
          status: "failed",
          message,
          retryInSec: Math.ceil(delayMs / 1_000),
        });
        console.error(
          `[Discord/${label}] Login failed (${nonRateLimitFailures}/${maxLoginAttempts}); retrying in ${formatRetryDelay(delayMs)}: ${message}`,
        );
        if (err instanceof Error && err.stack) {
          console.error(err.stack);
        }

        if (nonRateLimitFailures >= maxLoginAttempts) {
          throw new DiscordBootFatalError(
            `[Discord/${label}] Gateway login failed after ${maxLoginAttempts} attempts: ${message}`,
          );
        }
      }

      await sleep(delayMs);
    }
  }

  if (stopConnect.get(client)) {
    throw new Error(`[Discord/${label}] Gateway connect stopped`);
  }
}

export function stopDiscordClientConnect(client: Client): void {
  stopConnect.set(client, true);
}

export function isDiscordClientReady(client: Client): boolean {
  return client.isReady();
}
