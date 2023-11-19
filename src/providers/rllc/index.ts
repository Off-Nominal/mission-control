import { RLLClient, rllc } from "rocket-launch-live-client";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";

let client: RLLClient;

try {
  client = rllc(mcconfig.providers.rll.key);
  bootLogger.addLog(LogStatus.SUCCESS, "RLLC Client initialized.");
  bootLogger.logItemSuccess("rllClient");
} catch (err) {
  bootLogger.addLog(LogStatus.FAILURE, "RLLC Client failed to initialize.");
  console.error(err);
}

export default client;
