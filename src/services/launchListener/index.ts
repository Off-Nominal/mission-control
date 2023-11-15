import mcconfig from "../../mcconfig";
import { LogStatus, Logger } from "../../utilities/logger";
import { RLLEvents } from "../../types/eventEnums";
import { LogInitiator } from "../../types/logEnums";
import { helperBot } from "../../discord_clients";
import LaunchListener from "./LaunchListener";

const launchListener = new LaunchListener(mcconfig.providers.rll.key);

launchListener.on(RLLEvents.ERROR, (err) => {
  const logger = new Logger(
    "Rocketlaunch.live Client Error",
    LogInitiator.RLL,
    err.event
  );
  logger.addLog(LogStatus.FAILURE, err.error);
  logger.sendLog(helperBot);
});

export default launchListener;
