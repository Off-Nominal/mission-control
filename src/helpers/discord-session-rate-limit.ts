const SESSION_RESET_AT_RE =
  /resets at (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/i;

export function isDiscordSessionRateLimitError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes("Not enough sessions remaining")
  );
}

export function discordSessionRateLimitDelayMs(
  err: unknown,
  nowMs: number = Date.now(),
): number | null {
  if (!isDiscordSessionRateLimitError(err)) return null;
  if (!(err instanceof Error)) return null;
  const match = err.message.match(SESSION_RESET_AT_RE);
  if (!match) return null;
  const resetAtMs = Date.parse(match[1]);
  if (Number.isNaN(resetAtMs)) return null;
  return Math.max(1_000, resetAtMs - nowMs + 1_000);
}
