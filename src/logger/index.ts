import { Client } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "./Logger";

type BootChecklist = {
  db: boolean;
  helperBot: boolean;
  contentBot: boolean;
  eventsBot: boolean;
  ndb2Bot: boolean;
  githubAgent: boolean;
  starshipSiteChecker: boolean;
  wmFeedListener: boolean;
  mecoFeedListener: boolean;
  ofnFeedListener: boolean;
  rprFeedListener: boolean;
  hlFeedListener: boolean;
  hhFeedListener: boolean;
  ytFeedListener: boolean;
  newsFeed: boolean;
  rllClient: boolean;
  rllWatcher: boolean;
  api: boolean;
};

class BootLogger extends Logger {
  private checklist: BootChecklist = {
    db: false,
    helperBot: false,
    contentBot: false,
    eventsBot: false,
    ndb2Bot: false,
    githubAgent: false,
    starshipSiteChecker: false,
    wmFeedListener: false,
    mecoFeedListener: false,
    ofnFeedListener: false,
    rprFeedListener: false,
    hlFeedListener: false,
    hhFeedListener: false,
    ytFeedListener: false,
    newsFeed: false,
    rllClient: false,
    rllWatcher: false,
    api: false,
  };

  constructor(title: string, initiator: LogInitiator, eventName: string) {
    super(title, initiator, eventName);
    console.log("*** BOOTING ***");
  }

  logItemSuccess(item: keyof BootChecklist) {
    this.checklist[item] = true;
  }

  checkBoot(client: Client) {
    let bootLogAttempts = 0;
    const bootChecker = setInterval(() => {
      let booted = true;

      for (const item in this.checklist) {
        if (!this.checklist[item]) {
          booted = false;
          break;
        }
      }

      if (booted) {
        this.addLog(
          LogStatus.SUCCESS,
          "Boot Checklist complete. Mission Control is online 🚀"
        );
        this.sendLog(client);
        console.log("*** BOOTUP COMPLETE ***");
        clearInterval(bootChecker);
      } else {
        bootLogAttempts++;
      }

      if (bootLogAttempts > 15) {
        let failures = "";

        for (const item in this.checklist) {
          if (!this.checklist[item]) {
            failures += `- ❌: ${item}`;
          }
        }

        this.addLog(
          LogStatus.FAILURE,
          `Boot Checklist still incomplete after 15 attempts, logger aborted. Failed items:\n${failures}`
        );
        this.sendLog(client);
        console.log("*** BOOTUP FAILURE CHECK LOGS ***");
        clearInterval(bootChecker);
      }
    }, 1000);
  }
}

const bootLogger = new BootLogger(
  "Application Bootup Log",
  LogInitiator.SERVER,
  "Bootup"
);

export default bootLogger;
