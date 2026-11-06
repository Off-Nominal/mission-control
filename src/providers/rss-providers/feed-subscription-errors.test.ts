import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import { FeedWatcherEvents } from "./FeedWatcher/types";
import {
  formatFeedError,
  isPermanentRequestFailure,
  releaseResponseStream,
} from "./FeedWatcher/errors";
import {
  emitSubscriptionReport,
  NewsManagerEvents,
} from "./NewsListener/reportSubscriptionResults";

const rejected = (reason: string): PromiseRejectedResult => ({
  status: "rejected",
  reason,
});

const fulfilled = (value: string): PromiseFulfilledResult<string> => ({
  status: "fulfilled",
  value,
});

describe("news feed subscription errors", () => {
  it("does not use Node's reserved error event name", () => {
    assert.notEqual(NewsManagerEvents.ERROR, "error");
    assert.notEqual(FeedWatcherEvents.ERROR, "error");

    const sources = [
      "src/providers/rss-providers/NewsListener/reportSubscriptionResults.ts",
      "src/providers/rss-providers/FeedWatcher/types.ts",
      "src/providers/rss-providers/ContentListener/index.ts",
    ];

    for (const file of sources) {
      const source = readFileSync(resolve(file), "utf8");
      assert.doesNotMatch(
        source,
        /ERROR\s*=\s*"error"/,
        `${file} still emits the reserved error event`
      );
    }
  });

  it("reports every failed feed in one event and does not throw with no listener", () => {
    const emitter = new EventEmitter();
    const errors: string[] = [];
    const ready: string[] = [];

    assert.doesNotThrow(() => {
      emitSubscriptionReport(
        (event, message) => emitter.emit(event, message),
        [
          rejected("ESA Space Science"),
          rejected("ESA Space Transportation"),
          fulfilled("NASA"),
        ]
      );
    });

    emitter.on(NewsManagerEvents.ERROR, (message: string) => errors.push(message));
    emitter.on(NewsManagerEvents.READY, (message: string) => ready.push(message));

    emitSubscriptionReport(
      (event, message) => emitter.emit(event, message),
      [
        rejected("ESA Space Science"),
        rejected("ESA Space Transportation"),
        fulfilled("NASA"),
      ]
    );

    assert.deepEqual(errors, [
      "Error subscribing to 2 news feeds: ESA Space Science, ESA Space Transportation.",
    ]);
    assert.deepEqual(ready, [
      "Successfully subscribed to 1/3 news feeds.",
    ]);
  });

  it("keeps a one-shot listener from crashing on more than one failed feed", () => {
    const emitter = new EventEmitter();
    const errors: string[] = [];
    emitter.once(NewsManagerEvents.ERROR, (message: string) => {
      errors.push(message);
    });

    assert.doesNotThrow(() => {
      emitSubscriptionReport(
        (event, message) => emitter.emit(event, message),
        [
          rejected("ESA Space Engineering"),
          rejected("ESA Operations"),
          rejected("ESA Space Transportation"),
        ]
      );
    });

    assert.equal(errors.length, 1);
    assert.match(errors[0], /Failure to subscribe to any News Feeds/);
    assert.match(errors[0], /ESA Space Transportation/);
    assert.match(errors[0], /ESA Operations/);
  });

  it("emits ready without an error when every feed subscribes", () => {
    const events: string[] = [];
    emitSubscriptionReport(
      (event, message) => {
        events.push(`${event}:${message}`);
      },
      [fulfilled("NASA"), fulfilled("JPL")]
    );

    assert.deepEqual(events, [
      `${NewsManagerEvents.READY}:Successfully subscribed to 2/2 news feeds.`,
    ]);
  });

  it("emits a single failure when the CMS returns no feeds", () => {
    const events: string[] = [];
    emitSubscriptionReport((event, message) => {
      events.push(`${event}:${message}`);
    }, []);

    assert.deepEqual(events, [
      `${NewsManagerEvents.ERROR}:Failure to subscribe to any News Feeds.`,
    ]);
  });
});

describe("feed request errors", () => {
  const axiosError = (
    status: number,
    url = "https://www.esa.int/rssfeed/Our_Activities/Space_Science"
  ) => ({
    isAxiosError: true,
    message: `Request failed with status code ${status}`,
    response: { status, statusText: status === 404 ? "Not Found" : "Error" },
    config: { url },
  });

  it("formats an HTTP failure without the request object", () => {
    assert.equal(
      formatFeedError(axiosError(404)),
      "HTTP 404 Not Found for https://www.esa.int/rssfeed/Our_Activities/Space_Science"
    );
  });

  it("treats 404 as permanent and 429 and 503 as retryable", () => {
    assert.equal(isPermanentRequestFailure(axiosError(404)), true);
    assert.equal(isPermanentRequestFailure(axiosError(401)), true);
    assert.equal(isPermanentRequestFailure(axiosError(429)), false);
    assert.equal(isPermanentRequestFailure(axiosError(408)), false);
    assert.equal(isPermanentRequestFailure(axiosError(503)), false);
    assert.equal(isPermanentRequestFailure(new Error("socket hang up")), false);
    assert.equal(
      isPermanentRequestFailure({
        isAxiosError: true,
        message: "timeout",
        code: "ECONNABORTED",
      }),
      false
    );
  });

  it("destroys an unread error response stream", () => {
    let destroyed = false;
    const stream = {
      destroyed: false,
      destroy() {
        destroyed = true;
        this.destroyed = true;
      },
    };
    const error = {
      ...axiosError(404),
      response: { ...axiosError(404).response, data: stream },
    };

    releaseResponseStream(error);
    releaseResponseStream(error);

    assert.equal(destroyed, true);
    assert.equal(stream.destroyed, true);
  });
});
