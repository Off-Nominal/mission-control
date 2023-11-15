import mcconfig from "./mcconfig";

// Services
import launchListener from "./services/launchListener";
import siteChecker from "./services/siteListener";
import feedListeners from "./services/feedListeners";

// Main Providers
import { contentBot, eventsBot, helperBot, ndb2Bot } from "./discord_clients";
import db from "./db";
import api from "./api";

// Handlers
import handlers from "./clients/handlers";

// import handleError from "./clients/actions/handleError";
// import { ContentListener } from "./listeners/contentListener/contentListener";

// import {
//   ContentListnerEvents,
//   DevEvents,
//   MemberManagerEvents,
//   NewsManagerEvents,
//   RLLEvents,
// } from "./types/eventEnums";
import { Logger, LogInitiator, LogStatus } from "./services/logger";
// import newsFeedListener from "./services/newsfeedListener";
// import { HelperBotEvents } from "./discord_clients/helper";
// import eventsListener from "./services/eventsListener";
// import { ContentBotEvents } from "./discord_clients/content";
// import { EventListenerEvents } from "./services/eventsListener/EventsListener";
// import { SiteListenerEvents } from "./services/siteListener/SiteListener";

// Boot Logger
console.log("*** BOOTING... ***");
const bootLog = new Logger(
  "Application Bootup Log",
  LogInitiator.SERVER,
  "Bootup"
);
bootLog.addLog(LogStatus.INFO, "Off-Nominal Discord App in Startup.");

// const bootChecklist = {
//   db: false,
//   helperBot: false,
//   contentBot: false,
//   eventBot: false,
//   ndb2Bot: false,
//   starshipSiteChecker: false,
//   wmFeedListener: false,
//   mecoFeedListener: false,
//   ofnFeedListener: false,
//   rprFeedListener: false,
//   hlFeedListener: false,
//   hhFeedListener: false,
//   ytFeedListener: false,
//   eventsListener: false,
//   newsFeed: false,
//   rllClient: false,
//   express: false,
// };

// // Database
// db.connect()
//   .then(() => {
//     bootLog.addLog(LogStatus.SUCCESS, "Database connected");
//   })
//   .catch((err) => {
//     console.error(err);
//     bootLog.addLog(LogStatus.FAILURE, "Failure to connect to Database");
//   })
//   .finally(() => {
//     bootChecklist.db = true;
//   });

// export enum Feed {
//   WEMARTIANS = "wm",
//   MAIN_ENGINE_CUT_OFF = "meco",
//   OFF_NOMINAL_PODCAST = "ofn",
//   RED_PLANET_REVIEW = "rpr",
//   MECO_HEADLINES = "hl",
//   OFF_NOMINAL_YOUTUBE = "yt",
//   HAPPY_HOUR = "hh",
// }

// export type FeedList = {
//   [Feed.WEMARTIANS]: ContentListener;
//   [Feed.MAIN_ENGINE_CUT_OFF]: ContentListener;
//   [Feed.OFF_NOMINAL_PODCAST]: ContentListener;
//   [Feed.RED_PLANET_REVIEW]: ContentListener;
//   [Feed.HAPPY_HOUR]: ContentListener;
//   [Feed.MECO_HEADLINES]: ContentListener;
//   [Feed.OFF_NOMINAL_YOUTUBE]: ContentListener;
// };

// /***********************************
//  *  API Initialization
//  ************************************/

// api.listen(mcconfig.api.port, () => {
//   bootLog.addLog(LogStatus.SUCCESS, "Express Server booted and listening.");
//   bootChecklist.express = true;
// });

// /***********************************
//  *  RLL Event Listener
//  ************************************/

// launchListener.on(RLLEvents.READY, (message) => {
//   bootChecklist.rllClient = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// launchListener.on(RLLEvents.BOOT_ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// /***********************************
//  *  News Feed Listener Setup
//  ************************************/

// newsFeedListener.on(NewsManagerEvents.READY, (message) => {
//   bootChecklist.newsFeed = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// newsFeedListener.on(NewsManagerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// newsFeedListener.initialize();

// /***********************************
//  *  Events Listener Setup
//  ************************************/

// /***********************************
//  *  Member Manager Setup
//  ************************************/

// // const memberManager = new MemberManager();
// // memberManager.on(MemberManagerEvents.SEND_DELINQUENTS, () => {
// //   handlers.helper.handleSendDelinquents(utilityBot);
// // });

// /***********************************
//  *  Feed Listener Setup
//  ************************************/

// /***********************************
//  *  NDB2 Bot Event Handlers
//  ************************************/

// ndb2Bot.once("ready", () => {
//   bootLog.addLog(LogStatus.SUCCESS, "NDB2 Bot ready");
//   bootChecklist.ndb2Bot = true;
// });

// ndb2Bot.login(mcconfig.discord.clients.ndb2.token);

// /***********************************
//  *  Utility Bot Event Handlers
//  ************************************/

// helperBot.once("ready", () => {
//   bootLog.addLog(LogStatus.SUCCESS, "Main Bot ready");
//   bootChecklist.helperBot = true;
// });

// helperBot.login(mcconfig.discord.clients.helper.token);

// /***********************************
//  *  Content Bot Event Handlers
//  ************************************/

// contentBot.once("ready", handlers.content.handleReady);
// contentBot.once("ready", () => {
//   bootLog.addLog(LogStatus.SUCCESS, "Content Bot ready");
//   bootChecklist.contentBot = true;
// });
// contentBot.on("threadCreate", handlers.content.handleThreadCreate);
// contentBot.on("interactionCreate", (interaction) => {
//   handlers.content.handleInteractionCreate(interaction, feedListeners);
// });
// contentBot.on("error", handleError);
// contentBot.on(ContentBotEvents.RSS_LIST, handlers.content.handleRssList);

// /***********************************
//  *  Event Bot Event Handlers
//  ************************************/

// eventsBot.once("ready", () => {
//   bootLog.addLog(LogStatus.SUCCESS, "Event Bot ready");
//   bootChecklist.eventBot = true;
// });

// eventsBot.login(mcconfig.discord.clients.events.token);

// /***********************************
//  *  Feed Listeners Event Handlers
//  ************************************/

// feedListeners.wm.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.wmFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.wm.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.meco.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.mecoFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.meco.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.ofn.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.ofnFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.ofn.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.rpr.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.rprFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.rpr.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.hl.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.hlFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.hl.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.hh.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.hhFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.hh.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.yt.on(ContentListnerEvents.READY, (message) => {
//   bootChecklist.ytFeedListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });
// feedListeners.yt.on(ContentListnerEvents.ERROR, (message) => {
//   bootLog.addLog(LogStatus.FAILURE, message);
// });

// feedListeners.wm.initialize();
// feedListeners.meco.initialize();
// feedListeners.ofn.initialize();
// feedListeners.rpr.initialize();
// feedListeners.hl.initialize();
// feedListeners.hh.initialize();
// feedListeners.yt.initialize();

// /***********************************
//  *  Event Listeners Event Handlers
//  ************************************/

// eventsListener.on(EventListenerEvents.READY, (message) => {
//   bootChecklist.eventsListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });

// /***********************************
//  *  Site Listeners Event Handlers
//  ************************************/

// siteChecker.starship.on(SiteListenerEvents.READY, () => {
//   bootChecklist.starshipSiteChecker = true;
//   bootLog.addLog(
//     LogStatus.SUCCESS,
//     `Site listener monitoring Starship Website`
//   );
// });
// siteChecker.starship.on(SiteListenerEvents.UPDATE, (update) =>
//   helperBot.emit(HelperBotEvents.STARSHIP_UPDATE, update)
// );

// siteChecker.starship.initialize();

// /***********************************
//  *  Boot Logger
//  ************************************/

// let bootLogAttempts = 0;
// const bootChecker = setInterval(() => {
//   let booted = true;

//   for (const item in bootChecklist) {
//     if (!bootChecklist[item]) {
//       booted = false;
//       break;
//     }
//   }

//   if (booted) {
//     bootLog.addLog(
//       LogStatus.SUCCESS,
//       "Boot Checklist complete. The Off-Nominal Discord Bot is online."
//     );
//     bootLog.sendLog(helperBot);
//     console.log("*** BOOTUP COMPLETE ***");
//     clearInterval(bootChecker);
//   } else {
//     bootLogAttempts++;
//   }

//   if (bootLogAttempts > 15) {
//     let failures = "";

//     for (const item in bootChecklist) {
//       if (!bootChecklist[item]) {
//         failures += `- ❌: ${item}`;
//       }
//     }

//     bootLog.addLog(
//       LogStatus.FAILURE,
//       `Boot Checklist still incomplete after 15 attempts, logger aborted. Failed items:\n${failures}`
//     );
//     bootLog.sendLog(helperBot);
//     console.log("*** BOOTUP FAILURE CHECK LOGS ***");
//     clearInterval(bootChecker);
//   }
// }, 1000);

// /***********************************
//  *  Dev Test Event Handlers
//  *  Only runs in Dev environment
//  *  to enable simulated events
//  ************************************/

// if (mcconfig.env === "dev") {
//   helperBot.on("messageCreate", handlers.dev.handleMessageCreate);

//   helperBot.on(DevEvents.NEW_ENTRIES, (show) => {
//     const feed = feedListeners[show] as ContentListener;
//     feed.emit(ContentListnerEvents.NEW, feed.fetchRecent());
//   });
//   helperBot.on(DevEvents.DB_TEST, () => {
//     console.log("dbtest invoked");
//     db.query("SELECT NOW()")
//       .then((res) => console.log(`Time on database is ${res.rows[0].now}`))
//       .catch((err) => {
//         console.error("Could not connect to db");
//         console.error(err);
//       });
//   });

//   helperBot.on(
//     DevEvents.THREAD_DIGEST_SEND,
//     handlers.helper.handleThreadDigestSend
//   );
// }
