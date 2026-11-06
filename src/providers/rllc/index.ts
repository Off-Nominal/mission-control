import { RLLClient, RLLWatcher, rllc } from "rocket-launch-live-client";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";

export let rllClient: RLLClient;
export let rllWatcher: RLLWatcher;

export function startLaunchClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      rllClient = rllc(mcconfig.providers.rll.key || "");
      bootLogger.addLog(LogStatus.SUCCESS, "RLLC Client initialized.");
      bootLogger.logItemSuccess("rllClient");

      rllWatcher = rllClient.watch();

      rllWatcher.once("ready", () => {
        bootLogger.addLog(LogStatus.SUCCESS, "RLLC Watcher initialized.");
        bootLogger.logItemSuccess("rllWatcher");
        resolve();
      });

      rllWatcher.once("init_error", (err) => {
        bootLogger.addLog(LogStatus.FAILURE, "RLLC Watcher failed to initialize.");
        console.error(err.error);
        console.error(err.message);
        reject(
          err.error instanceof Error
            ? err.error
            : new Error(err.message || "RLLC watcher failed to initialize"),
        );
      });

      rllWatcher.start();
    } catch (err) {
      bootLogger.addLog(LogStatus.FAILURE, "RLLC Client failed to initialize.");
      console.error(err);
      reject(err);
    }
  });
}
