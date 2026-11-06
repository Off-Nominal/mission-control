import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BootPhaseError, runBootSequence } from "./run-boot-sequence";
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
});
