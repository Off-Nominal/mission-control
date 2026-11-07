// Coolify polls /health every few seconds. Those 200s are liveness, not a
// failure, and they bury the gateway log. Print a probe only when it fails.
const QUIET_WHEN_OK = new Set(["/health", "/ready"]);

export function shouldSkipHealthAccessLog(
  url: string | undefined,
  statusCode: number | undefined,
): boolean {
  const path = (url ?? "").split("?")[0];
  if (!QUIET_WHEN_OK.has(path)) return false;
  return (statusCode ?? 200) < 400;
}
