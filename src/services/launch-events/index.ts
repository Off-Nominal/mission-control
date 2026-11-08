import { RLLEntity, RLLWatcher, rllc } from "rocket-launch-live-client";
import { parseCommands } from "../../helpers/parseCommands";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import { Providers } from "../../providers";
import { syncEvents } from "./syncLaunches";
import { watchLaunches } from "./watch";

export default function LaunchEvents({
  eventsBot,
  helperBot,
  mcconfig,
}: Providers) {
  let rllWatcher: RLLWatcher;
  try {
    const launchClient = rllc(mcconfig.providers.rll.key || "");
    bootLogger.addLog(LogStatus.SUCCESS, "RLLC Client initialized.");
    bootLogger.logItemSuccess("rllClient");
    rllWatcher = launchClient.watch();
  } catch (err) {
    bootLogger.addLog(LogStatus.FAILURE, "RLLC Client failed to initialize.");
    console.error(err);
    return;
  }

  const sync = (eventType: "new" | "change" | "ready") => {
    const run = () => {
      void syncEvents(rllWatcher.launches, eventsBot, eventType).catch((err) => {
        console.error(`[LaunchEvents] Sync failed (${eventType}):`, err);
      });
    };

    if (eventsBot.isReady()) {
      run();
    } else {
      eventsBot.once("clientReady", run);
    }
  };

  watchLaunches(
    rllWatcher,
    (eventType) => {
      if (eventType === "ready") {
        bootLogger.addLog(LogStatus.SUCCESS, "RLLC Watcher initialized.");
        bootLogger.logItemSuccess("rllWatcher");
      }
      sync(eventType);
    },
    (err) => {
      bootLogger.addLog(LogStatus.FAILURE, "RLLC Watcher failed to initialize.");
      console.error(err);
    },
  );

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
