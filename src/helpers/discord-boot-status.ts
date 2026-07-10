import type { Client } from "discord.js";

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

const DISCORD_BOT_LABELS: DiscordBotLabel[] = [
  "ndb2",
  "helper",
  "content",
  "events",
];

const statuses = new Map<DiscordBotLabel, DiscordBotStatus>();
const clients = new Map<DiscordBotLabel, Client>();

export function initDiscordBootStatus(): void {
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

export function getDiscordBootStatus() {
  const bots = DISCORD_BOT_LABELS.map((label) => liveStatus(label));
  const allReady = bots.every((bot) => bot.status === "connected");
  const anyRateLimited = bots.some((bot) => bot.status === "rate_limited");

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
  } else {
    summary = `Waiting for Discord gateway clients: ${waiting.join(", ")}`;
  }

  return { allReady, anyRateLimited, bots, summary };
}
