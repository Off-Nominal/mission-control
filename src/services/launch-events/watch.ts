type LaunchEvent = "new" | "change" | "ready";

type LaunchWatcherLike = {
  on(event: string, listener: (...args: any[]) => void): void;
  once(event: string, listener: (...args: any[]) => void): void;
  start(): void;
};

// Subscribe first. The watcher emits "ready" once, from start().
export function watchLaunches(
  watcher: LaunchWatcherLike,
  sync: (eventType: LaunchEvent) => void,
  onInitError: (err: unknown) => void,
): void {
  watcher.on("ready", () => sync("ready"));
  watcher.on("new", () => sync("new"));
  watcher.on("change", () => sync("change"));
  watcher.on("error", (err) => {
    console.error("[LaunchEvents] Watcher error:", err);
  });
  watcher.once("init_error", onInitError);
  watcher.start();
}
