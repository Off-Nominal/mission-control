import {
  BootPhase,
  BootTaskFailure,
} from "./types";

export class BootPhaseError extends Error {
  readonly phase: string;
  readonly failures: BootTaskFailure[];

  constructor(phase: string, failures: BootTaskFailure[]) {
    const detail = failures
      .map((failure) => `${failure.name} (${failure.message})`)
      .join("; ");
    super(`Boot phase "${phase}" failed: ${detail}`);
    this.name = "BootPhaseError";
    this.phase = phase;
    this.failures = failures;
  }
}

function failureMessage(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  return String(reason);
}

// Tasks in a phase run together. The phase resolves when every required task does.
export async function runBootPhase(phase: BootPhase): Promise<void> {
  console.log(
    `[Boot] Phase "${phase.name}" starting: ${phase.tasks
      .map((task) => task.name)
      .join(", ")}`,
  );

  const settled = await Promise.allSettled(
    phase.tasks.map(async (task) => {
      await task.run();
      console.log(`[Boot] Phase "${phase.name}" ready: ${task.name}`);
    }),
  );

  const failures: BootTaskFailure[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      return;
    }
    const task = phase.tasks[index];
    const message = failureMessage(result.reason);
    if (task.required === false) {
      console.error(
        `[Boot] Phase "${phase.name}" optional task ${task.name} failed: ${message}`,
      );
      return;
    }
    console.error(
      `[Boot] Phase "${phase.name}" failed: ${task.name}: ${message}`,
    );
    failures.push({ name: task.name, message });
  });

  if (failures.length > 0) {
    throw new BootPhaseError(phase.name, failures);
  }

  console.log(`[Boot] Phase "${phase.name}" complete`);
}

export const FOUNDATION_RETRY_BASE_MS = 5_000;
export const FOUNDATION_RETRY_MAX_MS = 60_000;

// First retry waits 5s, then 10s, 20s, 40s, and then 1 minute.
export function nextFoundationRetryDelay(failedAttempts: number): number {
  return Math.min(
    FOUNDATION_RETRY_BASE_MS * 2 ** failedAttempts,
    FOUNDATION_RETRY_MAX_MS,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type BootRetryOptions = {
  sleep?: (ms: number) => Promise<void>;
  delayMs?: (failedAttempts: number) => number;
};

// A failed required task is tried again. Tasks that already succeeded are
// left alone, so a listening server or a connected database is not opened twice.
export async function runBootPhaseWithRetry(
  phase: BootPhase,
  options: BootRetryOptions = {},
): Promise<void> {
  const wait = options.sleep ?? sleep;
  const delayMs = options.delayMs ?? nextFoundationRetryDelay;
  const pending = new Map(phase.tasks.map((task) => [task.name, task]));
  let failedAttempts = 0;

  while (pending.size > 0) {
    try {
      await runBootPhase({ name: phase.name, tasks: [...pending.values()] });
      return;
    } catch (error) {
      if (!(error instanceof BootPhaseError)) {
        throw error;
      }

      const failedNames = new Set(error.failures.map((failure) => failure.name));
      for (const name of [...pending.keys()]) {
        if (!failedNames.has(name)) {
          pending.delete(name);
        }
      }

      if (pending.size === 0) {
        throw error;
      }

      const delay = delayMs(failedAttempts);
      failedAttempts += 1;
      console.error(
        `[Boot] Phase "${phase.name}" retrying ${error.failures
          .map((failure) => failure.name)
          .join(", ")} in ${Math.round(delay / 1000)}s`,
      );
      await wait(delay);
    }
  }
}

// Phases run in order. A phase marked retryUntilReady keeps trying failed
// required tasks. Any other failed phase rejects and later phases do not start.
export async function runBootSequence(
  phases: BootPhase[],
  onPhaseComplete?: (phase: BootPhase) => void,
  options?: BootRetryOptions,
): Promise<void> {
  for (const phase of phases) {
    if (phase.retryUntilReady) {
      await runBootPhaseWithRetry(phase, options);
    } else {
      await runBootPhase(phase);
    }
    onPhaseComplete?.(phase);
  }
}
