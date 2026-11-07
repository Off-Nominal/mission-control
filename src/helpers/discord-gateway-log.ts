import { WebSocketManager } from "@discordjs/ws";
import type { Client } from "discord.js";
import type { DiscordBotLabel } from "./discord-boot-status";

const labelsByToken = new Map<string, DiscordBotLabel>();

const NOISY_DEBUG_PREFIXES = [
  "Heartbeat acknowledged",
  "Preparing first heartbeat",
  "First heartbeat sent",
  "Cancelled initial heartbeat",
  "Was about to hit the send rate limit",
  "Tried to send a non-crucial payload",
  "Connection closed while waiting for the send rate limit",
];

const CLOSE_CODES: Record<number, string> = {
  1000: "Normal",
  1001: "Going away",
  1006: "Abnormal closure",
  1011: "Internal error",
  4000: "Unknown error",
  4001: "Unknown opcode",
  4002: "Decode error",
  4003: "Not authenticated",
  4004: "Authentication failed",
  4005: "Already authenticated",
  4007: "Invalid seq",
  4008: "Rate limited",
  4009: "Session timed out",
  4010: "Invalid shard",
  4011: "Sharding required",
  4012: "Invalid API version",
  4013: "Invalid intent",
  4014: "Disallowed intent",
  4200: "Resuming",
};

export type GatewayDebugKind = "identify" | "destroy" | "info";

export type GatewayDebugEvent = {
  line: string;
  kind: GatewayDebugKind;
};

type SessionStartLimit = {
  total?: number;
  remaining?: number;
  reset_after?: number;
  max_concurrency?: number;
};

export type GatewayBotInfo = {
  shards?: number;
  session_start_limit?: SessionStartLimit;
};

type GatewayManager = {
  options: { token?: string };
  gatewayInformation: { data: GatewayBotInfo; expiresAt: number } | null;
  fetchGatewayInformation: (force?: boolean) => Promise<GatewayBotInfo>;
};

const attached = new WeakSet<Client>();
let budgetLogInstalled = false;

export function registerGatewayLabel(
  token: string,
  label: DiscordBotLabel,
): void {
  labelsByToken.set(token, label);
  labelsByToken.set(token.replace(/^(Bot|Bearer)\s*/i, ""), label);
}

export function gatewayLabelForToken(token: string | undefined): string {
  if (!token) return "gateway";
  return labelsByToken.get(token) ?? "gateway";
}

export function formatCloseCode(code: number | undefined): string {
  if (typeof code !== "number") return "unknown";
  const name = CLOSE_CODES[code];
  return name ? `${code} ${name}` : String(code);
}

export function formatRetryDelay(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 90) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${seconds}s (${minutes}m)`;
  return `${seconds}s (${hours}h ${minutes}m)`;
}

export function formatSessionStartLimit(
  info: GatewayBotInfo,
  cached: boolean,
  nowMs: number,
): string {
  const limit = info.session_start_limit;
  const resetAfter = limit?.reset_after;
  const resetAt =
    typeof resetAfter === "number"
      ? new Date(nowMs + resetAfter).toISOString()
      : "unknown";
  const cacheNote = cached
    ? "cached=true (remaining is from an earlier fetch and does not drop as sessions are spent)"
    : "cached=false";
  return `Gateway limit shards=${info.shards ?? "unknown"} remaining=${limit?.remaining ?? "unknown"} total=${limit?.total ?? "unknown"} reset_at=${resetAt} reset_after_ms=${resetAfter ?? "unknown"} max_concurrency=${limit?.max_concurrency ?? "unknown"} ${cacheNote}`;
}

export function interpretGatewayDebug(message: string): GatewayDebugEvent | null {
  const flat = message.replace(/\s*\n\s*/g, " | ").trim();
  const body = flat.replace(/^\[WS => [^\]]+\]\s*/, "");
  if (body.startsWith("Manager was destroyed")) {
    return { line: "[WS => Manager] Manager was destroyed", kind: "info" };
  }
  if (NOISY_DEBUG_PREFIXES.some((prefix) => body.startsWith(prefix))) {
    return null;
  }
  if (body.startsWith("Identifying")) {
    return { line: flat, kind: "identify" };
  }
  if (body.startsWith("Destroying shard")) {
    return { line: flat, kind: "destroy" };
  }
  return { line: flat, kind: "info" };
}

export function isGatewayAlarm(line: string): boolean {
  return /Recover: Reconnect|WebSocket rate limit|Invalid session|Authentication failed|Disallowed intent|not recoverable|network error|Invalid intent/i.test(
    line,
  );
}

function logGateway(label: string, line: string, alarm: boolean): void {
  const text = `[Discord/${label}] ${line}`;
  if (alarm) console.error(text);
  else console.log(text);
}

export function installGatewayBudgetLog(): void {
  if (budgetLogInstalled) return;
  budgetLogInstalled = true;

  const proto = WebSocketManager.prototype as unknown as GatewayManager;
  const original = proto.fetchGatewayInformation;
  proto.fetchGatewayInformation = async function fetchAndLog(force = false) {
    const cachedInfo = this.gatewayInformation;
    const cacheHit = Boolean(
      cachedInfo && cachedInfo.expiresAt > Date.now() && !force,
    );
    const data = await original.call(this, force);
    const label = gatewayLabelForToken(this.options?.token);
    console.log(
      `[Discord/${label}] ${formatSessionStartLimit(data, cacheHit, Date.now())}`,
    );
    return data;
  };
}

export function attachDiscordGatewayLog(
  client: Client,
  token: string,
  label: DiscordBotLabel,
): void {
  registerGatewayLabel(token, label);
  installGatewayBudgetLog();
  if (attached.has(client)) return;
  attached.add(client);

  const trace = { identifyAt: undefined as number | undefined, identifyCount: 0 };

  client.on("debug", (message: string) => {
    const event = interpretGatewayDebug(message);
    if (!event) return;
    if (event.kind === "identify") {
      trace.identifyCount += 1;
      trace.identifyAt = Date.now();
      logGateway(
        label,
        `${event.line} | identify #${trace.identifyCount} since process start (spends a session)`,
        false,
      );
      return;
    }
    logGateway(label, event.line, isGatewayAlarm(event.line));
  });

  client.on("shardReady", (id, unavailable) => {
    const elapsed =
      trace.identifyAt === undefined ? undefined : Date.now() - trace.identifyAt;
    const timing = elapsed === undefined ? "" : ` ${elapsed}ms after Identify`;
    console.log(
      `[Discord/${label}] shard ${id} ready${timing} unavailableGuilds=${unavailable?.size ?? 0}`,
    );
  });

  client.on("shardResume", (id, replayed) => {
    console.log(
      `[Discord/${label}] shard ${id} resumed replayedEvents=${replayed} (resume does not spend a session)`,
    );
  });

  client.on("shardReconnecting", (id) => {
    console.error(
      `[Discord/${label}] shard ${id} reconnecting ready=${client.isReady()}`,
    );
  });

  client.on("shardDisconnect", (event, id) => {
    console.error(
      `[Discord/${label}] shard ${id} disconnected close=${formatCloseCode(event.code)} wasClean=${event.wasClean}`,
    );
  });

  client.on("shardError", (error, id) => {
    console.error(`[Discord/${label}] shard ${id} error: ${error.message}`);
  });

  client.on("warn", (message: string) => {
    console.warn(`[Discord/${label}] ${message}`);
  });

  client.on("invalidated", () => {
    console.error(`[Discord/${label}] Gateway session invalidated`);
  });
}
