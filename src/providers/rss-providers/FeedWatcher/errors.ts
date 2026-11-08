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

// Three polls in a row. A single 404 can be a blip; a streak means the feed is gone.
export const PERMANENT_FEED_FAILURES_BEFORE_STOP = 3;

export function nextFeedPoll(
  consecutivePermanent: number,
  error: unknown,
): { consecutivePermanent: number; stop: boolean } {
  if (!isPermanentRequestFailure(error)) {
    return { consecutivePermanent: 0, stop: false };
  }

  const next = consecutivePermanent + 1;
  return {
    consecutivePermanent: next,
    stop: next >= PERMANENT_FEED_FAILURES_BEFORE_STOP,
  };
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
