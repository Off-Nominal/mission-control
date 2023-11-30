import axios from "axios";
import { Providers } from "../../providers";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import { Client } from "discord.js";
import helperBot from "../../providers/helper-bot";
import { ContentListenerEvents } from "../../providers/rss-providers/ContentListener";

function deploy(url: string, client: Client) {
  const logger = new Logger(
    "New WeMartians Episode",
    LogInitiator.DISCORD,
    "Deploying Site"
  );

  axios
    .post(url)
    .then(() => {
      logger.addLog(
        LogStatus.SUCCESS,
        "WeMartians Build Deployment Request sent."
      );
    })
    .catch((err) => {
      logger.addLog(
        LogStatus.FAILURE,
        "WeMartians Build Deployment Request failed."
      );
      console.error("Failed to deploy WeMartians Build.", err);
    })
    .finally(() => {
      logger.sendLog(client);
    });
}

export default function DeployWeMartiansSite({
  rssProviders,
  mcconfig,
}: Providers) {
  rssProviders.wm.on(ContentListenerEvents.NEW, () =>
    deploy(mcconfig.wemartians.deployUrl, helperBot)
  );
}
