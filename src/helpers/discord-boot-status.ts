import type { Client } from "discord.js";
import mcconfig from "../mcconfig";

export type DiscordBotLabel = "ndb2" | "helper" | "content" | "events";

export type DiscordBotConnectionStatus =
  | "pending"
  | "connecting"
  | "rate_limited"
  | "connected"
  | "disconnected"
  | "failed";

export type DiscordBotStatus = {
  label: DiscordBotLabel;
  status: DiscordBotConnectionStatus;
  message?: string;
  retryAt?: string;
  retryInSec?: number;
};

export type AppHealthPhase = "healthy" | "starting" | "rate_limited" | "degraded";

export type AppHealth = {
  ready: boolean;
  phase: AppHealthPhase;
  alert: boolean;
  bootAgeSec: number;
  reason: string;
  discord: Record<
    DiscordBotLabel,
    {
      status: DiscordBotConnectionStatus;
      retryInSec?: number;
      retryAt?: string;
      message?: string;
    }
  >;
};

const DISCORD_BOT_LABELS: DiscordBotLabel[] = [
  "ndb2",
  "helper",
  "content",
  "events",
];

const statuses = new Map<DiscordBotLabel, DiscordBotStatus>();
const clients = new Map<DiscordBotLabel, Client>();
let bootStartedAtMs = Date.now();

export function initDiscordBootStatus(): void {
  bootStartedAtMs = Date.now();
  for (const label of DISCORD_BOT_LABELS) {
    statuses.set(label, { label, status: "pending" });
  }
}

export function registerDiscordBootClient(
  label: DiscordBotLabel,
  client: Client,
): void {
  clients.set(label, client);
}

export function setDiscordBotStatus(
  label: DiscordBotLabel,
  update: Partial<Omit<DiscordBotStatus, "label">>,
): void {
  const current = statuses.get(label) ?? { label, status: "pending" };
  statuses.set(label, { ...current, ...update, label });
}

function liveStatus(label: DiscordBotLabel): DiscordBotStatus {
  const recorded = statuses.get(label) ?? { label, status: "pending" };
  const client = clients.get(label);

  if (client?.isReady()) {
    return { ...recorded, label, status: "connected" };
  }

  if (
    recorded.status === "connected" ||
    recorded.status === "disconnected"
  ) {
    return { ...recorded, label, status: "disconnected" };
  }

  return recorded;
}

function discordPayload(bots: DiscordBotStatus[]): AppHealth["discord"] {
  return Object.fromEntries(
    bots.map((bot) => [
      bot.label,
      {
        status: bot.status,
        ...(bot.retryInSec !== undefined && { retryInSec: bot.retryInSec }),
        ...(bot.retryAt && { retryAt: bot.retryAt }),
        ...(bot.message && { message: bot.message }),
      },
    ]),
  ) as AppHealth["discord"];
}

export function getDiscordBootStatus() {
  const bots = DISCORD_BOT_LABELS.map((label) => liveStatus(label));
  const allReady = bots.every((bot) => bot.status === "connected");
  const anyRateLimited = bots.some((bot) => bot.status === "rate_limited");
  const anyFailed = bots.some((bot) => bot.status === "failed");

  const waiting = bots
    .filter((bot) => bot.status !== "connected")
    .map((bot) => `${bot.label} (${bot.status})`);

  let summary: string;
  if (allReady) {
    summary = "All Discord gateway clients connected";
  } else if (anyRateLimited) {
    const limited = bots
      .filter((bot) => bot.status === "rate_limited")
      .map((bot) => bot.label);
    summary = `Discord session rate limited: ${limited.join(", ")}`;
  } else if (anyFailed) {
    const failed = bots
      .filter((bot) => bot.status === "failed")
      .map((bot) => bot.label);
    summary = `Discord gateway login failed: ${failed.join(", ")}`;
  } else {
    summary = `Waiting for Discord gateway clients: ${waiting.join(", ")}`;
  }

  return { allReady, anyRateLimited, anyFailed, bots, summary };
}

export function getAppHealth(nowMs: number = Date.now()): AppHealth {
  const discord = getDiscordBootStatus();
  const bootAgeSec = Math.floor((nowMs - bootStartedAtMs) / 1_000);
  const startupAlertAfterSec = mcconfig.discord.boot.startupAlertAfterSec;

  let phase: AppHealthPhase;
  if (discord.allReady) {
    phase = "healthy";
  } else if (discord.anyRateLimited) {
    phase = "rate_limited";
  } else if (discord.anyFailed) {
    phase = "degraded";
  } else {
    phase = "starting";
  }

  const alert =
    phase === "rate_limited" ||
    phase === "degraded" ||
    (!discord.allReady && bootAgeSec >= startupAlertAfterSec);

  return {
    ready: discord.allReady,
    phase,
    alert,
    bootAgeSec,
    reason: discord.summary,
    discord: discordPayload(discord.bots),
  };
}
