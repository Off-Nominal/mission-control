// Coolify polls /health every few seconds, and the public port gets scanned
// for PHP shells. Neither of those is an application failure. Print a probe
// when it fails, and print a 404 never.
const QUIET_WHEN_OK = new Set(["/health", "/ready"]);

export function shouldSkipAccessLog(
  url: string | undefined,
  statusCode: number | undefined,
): boolean {
  if (statusCode === 404) return true;
  const path = (url ?? "").split("?")[0];
  if (!QUIET_WHEN_OK.has(path)) return false;
  return (statusCode ?? 200) < 400;
}
