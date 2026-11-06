export type BootTask = {
  name: string;
  run: () => Promise<void>;
};

export type BootPhase = {
  name: string;
  tasks: BootTask[];
};

export type BootTaskFailure = {
  name: string;
  message: string;
};
