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

// Tasks in a phase run together. The phase resolves only when every task does.
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
    const name = phase.tasks[index].name;
    const message = failureMessage(result.reason);
    console.error(`[Boot] Phase "${phase.name}" failed: ${name}: ${message}`);
    failures.push({ name, message });
  });

  if (failures.length > 0) {
    throw new BootPhaseError(phase.name, failures);
  }

  console.log(`[Boot] Phase "${phase.name}" complete`);
}

// Phases run in order. A failed phase rejects and later phases do not start.
export async function runBootSequence(
  phases: BootPhase[],
  onPhaseComplete?: (phase: BootPhase) => void,
): Promise<void> {
  for (const phase of phases) {
    await runBootPhase(phase);
    onPhaseComplete?.(phase);
  }
}
