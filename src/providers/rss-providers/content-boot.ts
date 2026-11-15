import { formatFeedError } from "./FeedWatcher/errors";

export const CONTENT_FEED_RETRY_MS = 30_000;

export type ContentFeedRetryTimer = {
  current: ReturnType<typeof setTimeout> | null;
};

// A show feed can be down at boot without blocking Discord. The caller retries.
export async function beginContentFeedLoad(
  name: string,
  load: () => Promise<void>,
  scheduleRetry: () => void,
): Promise<void> {
  try {
    await load();
  } catch (err) {
    scheduleRetry();
    throw new Error(
      `${name} failed; Discord will still connect. ${formatFeedError(err)}`,
    );
  }
}

export function scheduleContentFeedRetry(
  name: string,
  load: () => Promise<void>,
  timer: ContentFeedRetryTimer,
  waitMs = CONTENT_FEED_RETRY_MS,
): void {
  if (timer.current) return;

  timer.current = setTimeout(() => {
    timer.current = null;
    load().then(
      () => {
        console.log(`[Boot] ${name} loaded`);
      },
      (err) => {
        console.error(
          `[Boot] ${name} failed; retrying in ${waitMs / 1000}s. ${formatFeedError(err)}`,
        );
        scheduleContentFeedRetry(name, load, timer, waitMs);
      },
    );
  }, waitMs);
}
