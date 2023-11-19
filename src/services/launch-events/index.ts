import mcconfig from "../../mcconfig";
import { LogStatus, LogInitiator, Logger } from "../../logger/Logger";
import { RLLEvents } from "../../types/eventEnums";
import LaunchListener from "./LaunchListener";
import { Providers } from "../../providers";

export default function LaunchEvents({
  helperBot,
  eventsBot,
  rllClient,
}: Providers) {
  const launchListener = new LaunchListener(rllClient);

  launchListener.on(RLLEvents.ERROR, (err) => {
    const logger = new Logger(
      "RocketLaunch.Live Client Error",
      LogInitiator.RLL,
      err.event
    );
    logger.addLog(LogStatus.FAILURE, err.error);
    logger.sendLog(helperBot);
  });

  // launchListener.initialize();
}
