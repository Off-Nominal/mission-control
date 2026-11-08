import axios from "axios";

const RETRYABLE_CLIENT_STATUSES = new Set([408, 429]);

type DestroyableStream = {
  destroy?: () => void;
  destroyed?: boolean;
};

export function formatFeedError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const url = error.config?.url;
    const statusLabel = status
      ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}`
      : error.code || "request failed";

    if (url) {
      return `${statusLabel} for ${url}`;
    }

    return error.message ? `${statusLabel}: ${error.message}` : statusLabel;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

// Keep the normal interval through a short streak, then double the wait.
export const FEED_FAILURES_BEFORE_BACKOFF = 3;
export const FEED_BACKOFF_START_MS = 5 * 60 * 1000;
export const FEED_BACKOFF_MAX_MS = 60 * 60 * 1000;

export type FeedPollState = {
  consecutivePermanent: number;
  backoffStep: number;
};

export function nextFeedPoll(
  state: FeedPollState,
  error: unknown,
): FeedPollState & { delayMs: number | null } {
  if (!isPermanentRequestFailure(error)) {
    return { consecutivePermanent: 0, backoffStep: 0, delayMs: null };
  }

  const consecutivePermanent = state.consecutivePermanent + 1;
  if (
    state.backoffStep === 0 &&
    consecutivePermanent < FEED_FAILURES_BEFORE_BACKOFF
  ) {
    return { consecutivePermanent, backoffStep: 0, delayMs: null };
  }

  const backoffStep = state.backoffStep + 1;
  const delayMs = Math.min(
    FEED_BACKOFF_START_MS * 2 ** (backoffStep - 1),
    FEED_BACKOFF_MAX_MS,
  );
  return { consecutivePermanent, backoffStep, delayMs };
}

export function formatFeedWait(delayMs: number): string {
  const minutes = Math.round(delayMs / 60000);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

// 4xx responses other than timeout and rate-limit will not succeed on retry.
export function isPermanentRequestFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;
  if (status == null) {
    return false;
  }

  return (
    status >= 400 &&
    status < 500 &&
    !RETRYABLE_CLIENT_STATUSES.has(status)
  );
}

// Axios leaves responseType: "stream" bodies unread when it rejects on status.
// Destroy them so the socket is released instead of sitting until it errors later.
export function releaseResponseStream(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return;
  }

  const data = error.response?.data as DestroyableStream | undefined;
  if (data && typeof data.destroy === "function" && !data.destroyed) {
    data.destroy();
  }
}
