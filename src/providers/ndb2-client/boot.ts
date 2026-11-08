export const NDB2_SEASON_RETRY_MS = 30_000;

export function describeNdb2Failure(err: unknown): string {
  if (Array.isArray(err)) {
    const parts = err
      .filter((part) => part != null && String(part) !== "")
      .map((part) => String(part));
    if (parts.length > 0) return parts.join(" — ");
  }

  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return "NDB2 client failed to initialize";
}

// A season-load failure must not reject the boot phase. The caller retries.
export async function beginSeasonLoad(
  load: () => Promise<void>,
  scheduleRetry: () => void,
): Promise<void> {
  try {
    await load();
  } catch (err) {
    scheduleRetry();
    throw new Error(
      `Season load failed; Discord will still connect. ${describeNdb2Failure(err)}`,
    );
  }
}
