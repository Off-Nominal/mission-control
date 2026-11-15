import assert from "node:assert/strict";
import { describe, it } from "vitest";
import {
  BootPhaseError,
  nextFoundationRetryDelay,
  runBootSequence,
} from "./run-boot-sequence";
import { BootPhase } from "./types";

describe("boot sequence", () => {
  it("runs later phases only after the earlier phase succeeds", async () => {
    const calls: string[] = [];
    const phases: BootPhase[] = [
      {
        name: "foundation",
        tasks: [
          {
            name: "db",
            run: async () => {
              calls.push("db");
            },
          },
          {
            name: "feeds",
            run: async () => {
              calls.push("feeds");
            },
          },
        ],
      },
      {
        name: "discord",
        tasks: [
          {
            name: "helper",
            run: async () => {
              calls.push("helper");
            },
          },
        ],
      },
    ];

    const completed: string[] = [];
    await runBootSequence(phases, (phase) => {
      completed.push(phase.name);
    });

    assert.deepEqual(calls, ["db", "feeds", "helper"]);
    assert.deepEqual(completed, ["foundation", "discord"]);
  });

  it("does not start the Discord phase when foundation fails", async () => {
    const calls: string[] = [];
    const phases: BootPhase[] = [
      {
        name: "foundation",
        tasks: [
          {
            name: "db",
            run: async () => {
              calls.push("db");
            },
          },
          {
            name: "feeds",
            run: async () => {
              calls.push("feeds");
              throw new Error("feed unavailable");
            },
          },
        ],
      },
      {
        name: "discord",
        tasks: [
          {
            name: "helper",
            run: async () => {
              calls.push("helper");
            },
          },
          {
            name: "content",
            run: async () => {
              calls.push("content");
            },
          },
        ],
      },
    ];

    await assert.rejects(
      () => runBootSequence(phases),
      (error: unknown) => {
        assert.ok(error instanceof BootPhaseError);
        assert.equal(error.phase, "foundation");
        assert.deepEqual(
          error.failures.map((failure) => failure.name),
          ["feeds"],
        );
        return true;
      },
    );

    assert.deepEqual(calls.sort(), ["db", "feeds"]);
  });

  it("continues when an optional task fails", async () => {
    const calls: string[] = [];
    await runBootSequence([
      {
        name: "foundation",
        tasks: [
          {
            name: "db",
            run: async () => {
              calls.push("db");
            },
          },
          {
            name: "ndb2Client",
            required: false,
            run: async () => {
              calls.push("ndb2Client");
              throw new Error("HTTP Status 503");
            },
          },
        ],
      },
      {
        name: "discord",
        tasks: [
          {
            name: "helper",
            run: async () => {
              calls.push("helper");
            },
          },
        ],
      },
    ]);

    assert.deepEqual(calls, ["db", "ndb2Client", "helper"]);
  });

  it("retries only the required tasks that failed, then continues", async () => {
    const calls: string[] = [];
    const delays: number[] = [];
    let feedCalls = 0;

    await runBootSequence(
      [
        {
          name: "foundation",
          retryUntilReady: true,
          tasks: [
            {
              name: "db",
              run: async () => {
                calls.push("db");
              },
            },
            {
              name: "api",
              run: async () => {
                calls.push("api");
              },
            },
            {
              name: "feeds",
              run: async () => {
                feedCalls += 1;
                calls.push(`feeds${feedCalls}`);
                if (feedCalls < 3) {
                  throw new Error("Request failed with status code 404");
                }
              },
            },
            {
              name: "yt",
              required: false,
              run: async () => {
                calls.push("yt");
                throw new Error("Request failed with status code 404");
              },
            },
          ],
        },
        {
          name: "discord",
          tasks: [
            {
              name: "helper",
              run: async () => {
                calls.push("helper");
              },
            },
          ],
        },
      ],
      undefined,
      {
        sleep: async (ms) => {
          delays.push(ms);
        },
      },
    );

    assert.deepEqual(calls, [
      "db",
      "api",
      "feeds1",
      "yt",
      "feeds2",
      "feeds3",
      "helper",
    ]);
    assert.deepEqual(delays, [5_000, 10_000]);
  });

  it("caps the foundation retry wait at one minute", () => {
    assert.equal(nextFoundationRetryDelay(0), 5_000);
    assert.equal(nextFoundationRetryDelay(1), 10_000);
    assert.equal(nextFoundationRetryDelay(2), 20_000);
    assert.equal(nextFoundationRetryDelay(3), 40_000);
    assert.equal(nextFoundationRetryDelay(4), 60_000);
    assert.equal(nextFoundationRetryDelay(5), 60_000);
  });
});
