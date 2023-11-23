import { Providers } from "../../providers";
import { syncEvents } from "./syncLaunches";

export default function LaunchEvents({ eventsBot, rllWatcher }: Providers) {
  const sync = (eventType: "new" | "change" | "ready") => {
    syncEvents(rllWatcher.launches, eventsBot, eventType);
  };

  rllWatcher.on("ready", () => sync("ready"));
  rllWatcher.on("new", () => sync("new"));
  rllWatcher.on("change", () => sync("change"));
}
