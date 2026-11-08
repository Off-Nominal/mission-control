export type BootTask = {
  name: string;
  run: () => Promise<void>;
  // A failed optional task is logged and the phase still completes.
  required?: boolean;
};

export type BootPhase = {
  name: string;
  tasks: BootTask[];
};

export type BootTaskFailure = {
  name: string;
  message: string;
};
