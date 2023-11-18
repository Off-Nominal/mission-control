import mcconfig from "./mcconfig";

// Boot Logger
import bootLogger from "./services/logger";
import { LogStatus } from "./services/logger/Logger";
bootLogger.addLog(LogStatus.INFO, "Mission Control in Startup...");

// Services
// import launchListener from "./services/launchListener";
// import siteChecker from "./services/siteListener";
// import feedListeners from "./services/feedListeners";

// Providers
import { contentBot, helperBot, ndb2Bot, eventsBot } from "./discord_clients";
import api from "./api";
import db from "./db";

db.connect()
  .then(() => {
    bootLogger.addLog(LogStatus.SUCCESS, "Database connected");
    bootLogger.logItemSuccess("db");
  })
  .catch((err) => {
    console.error(err);
    bootLogger.addLog(LogStatus.FAILURE, "Failure to connect to Database");
  });

// import ndb2Client from "./providers/ndb2";
// import cache from "./providers/cache";

// import handleError from "./clients/actions/handleError";
// import { ContentListener } from "./listeners/contentListener/contentListener";

// import {
//   ContentListnerEvents,
//   DevEvents,
//   MemberManagerEvents,
//   NewsManagerEvents,
//   RLLEvents,
// } from "./types/eventEnums";

// import newsFeedListener from "./services/newsfeedListener";
// import { HelperBotEvents } from "./discord_clients/helper";
// import eventsListener from "./services/eventsListener";
// import { ContentBotEvents } from "./discord_clients/content";
// import { EventListenerEvents } from "./services/eventsListener/EventsListener";
// import { SiteListenerEvents } from "./services/siteListener/SiteListener";

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

/***********************************
 *  API Initialization
 ************************************/

api.listen(mcconfig.api.port, () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Express Server booted and listening.");
  bootLogger.logItemSuccess("api");
});

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

ndb2Bot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "NDB2 Bot ready");
  bootLogger.logItemSuccess("ndb2Bot");
});

ndb2Bot.login(mcconfig.discord.clients.ndb2.token);

// /***********************************
//  *  Utility Bot Event Handlers
//  ************************************/

helperBot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Helper Bot ready");
  bootLogger.logItemSuccess("helperBot");
});

helperBot.login(mcconfig.discord.clients.helper.token);

// /***********************************
//  *  Content Bot Event Handlers
//  ************************************/

contentBot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Content Bot ready");
  bootLogger.logItemSuccess("contentBot");
});

contentBot.login(mcconfig.discord.clients.content.token);

// /***********************************
//  *  Event Bot Event Handlers
//  ************************************/

eventsBot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Event Bot ready");
  bootLogger.logItemSuccess("eventsBot");
});

eventsBot.login(mcconfig.discord.clients.events.token);

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

/***********************************
 *  Boot Logger
 ************************************/

bootLogger.checkBoot(helperBot);

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
