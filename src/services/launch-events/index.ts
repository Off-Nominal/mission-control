import { RLLEntity } from "rocket-launch-live-client";
import { parseCommands } from "../../helpers/parseCommands";
import { Providers } from "../../providers";
import { syncEvents } from "./syncLaunches";

export default function LaunchEvents({
  eventsBot,
  helperBot,
  rllWatcher,
  mcconfig,
}: Providers) {
  const sync = (eventType: "new" | "change" | "ready") => {
    syncEvents(rllWatcher.launches, eventsBot, eventType);
  };

  rllWatcher.on("ready", () => sync("ready"));
  rllWatcher.on("new", () => sync("new"));
  rllWatcher.on("change", () => sync("change"));

  // Dev check on cache
  helperBot.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (mcconfig.env !== "dev") return;

    const [prefix] = parseCommands(message);

    if (prefix !== "!rllcache") return;

    const size = rllWatcher.launches.size;
    const entries = rllWatcher.launches.values();

    let first: RLLEntity.Launch;
    let last: RLLEntity.Launch;

    for (const entry of entries) {
      if (!first) first = entry;
      last = entry;
    }

    console.log("Cache size: ", size);
    console.log("First launch: ", first.name);
    console.log("Last launch: ", last.name);
  });
}
