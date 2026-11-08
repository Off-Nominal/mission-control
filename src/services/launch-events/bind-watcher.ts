type LaunchEvent = "new" | "change" | "ready";

type LaunchWatcher = {
  on(event: "new" | "change", listener: () => void): void;
  once(event: "ready", listener: () => void): void;
};

// The watcher emits "ready" once, during foundation, before services subscribe.
export function bindLaunchWatcher(
  watcher: LaunchWatcher,
  sync: (eventType: LaunchEvent) => void,
  alreadyReady: boolean,
): void {
  watcher.on("new", () => sync("new"));
  watcher.on("change", () => sync("change"));

  if (alreadyReady) {
    sync("ready");
    return;
  }

  watcher.once("ready", () => sync("ready"));
}
