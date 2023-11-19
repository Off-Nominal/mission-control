import mcconfig from "./mcconfig";

// Boot Logger
import bootLogger from "./logger";
import { LogStatus } from "./logger/Logger";
bootLogger.addLog(LogStatus.INFO, "Mission Control in Startup...");

// Providers
import { providers } from "./providers";

// Services
import SetDiscordClientPresence from "./services/set-discord-client-presence";
import JoinDiscordThread from "./services/join-discord-thread";
import SendHelp from "./services/send-help";
import PostNews from "./services/post-news";
import AddModsToThread from "./services/add-mods-to-thread";
import NDB2 from "./services/ndb2";
import DeployWeMartiansSite from "./services/deploy-wemartians-site";
import ThreadDigest from "./services/thread-digest";
import ContentSearch from "./services/content-search";
import StarshipSiteListener from "./services/starship-site-listener";

SetDiscordClientPresence(providers);
JoinDiscordThread(providers);
SendHelp(providers);
PostNews(providers);
AddModsToThread(providers);
NDB2(providers);
DeployWeMartiansSite(providers);
ThreadDigest(providers);
ContentSearch(providers);
StarshipSiteListener(providers);

// import launchListener from "./services/launchListener";
// import feedListeners from "./services/feedListeners";

// import { ContentListener } from "./listeners/contentListener/contentListener";

// import {
//   ContentListnerEvents,
//   DevEvents,
//   MemberManagerEvents,
//   NewsManagerEvents,
//   RLLEvents,
// } from "./types/eventEnums";

// import newsFeedListener from "./services/newsfeedListener";
// import eventsListener from "./services/eventsListener";
// import { SiteListenerEvents } from "./services/siteListener/SiteListener";

/***********************************
 *  API Initialization
 ************************************/

providers.api.listen(mcconfig.api.port, () => {
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

bootLogger.checkBoot(providers.helperBot);

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
