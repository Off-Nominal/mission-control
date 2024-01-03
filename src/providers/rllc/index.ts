import { RLLClient, RLLWatcher, rllc } from "rocket-launch-live-client";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";

export let rllClient: RLLClient;
export let rllWatcher: RLLWatcher;

try {
  const key = mcconfig.providers.rll.key;
  if (!key) {
    throw new Error("RLLC key not found in config.");
  }

  rllClient = rllc(key);
  bootLogger.addLog(LogStatus.SUCCESS, "RLLC Client initialized.");
  bootLogger.logItemSuccess("rllClient");

  rllWatcher = rllClient.watch();

  rllWatcher.on("ready", () => {
    bootLogger.addLog(LogStatus.SUCCESS, "RLLC Watcher initialized.");
    bootLogger.logItemSuccess("rllWatcher");
  });

  rllWatcher.on("init_error", (err) => {
    bootLogger.addLog(LogStatus.FAILURE, "RLLC Watcher failed to initialize.");
    console.error(err.error);
    console.error(err.message);
  });

  rllWatcher.start();
} catch (err) {
  bootLogger.addLog(LogStatus.FAILURE, "RLLC Client failed to initialize.");
  console.error(err);
}
