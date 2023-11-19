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
import ContentPost from "./services/content-post";
import AnnounceStream from "./services/announce-stream";

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
ContentPost(providers);
AnnounceStream(providers);

// import launchListener from "./services/launchListener";

// import eventsListener from "./services/eventsListener";

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
//  *  Event Listeners Event Handlers
//  ************************************/

// eventsListener.on(EventListenerEvents.READY, (message) => {
//   bootChecklist.eventsListener = true;
//   bootLog.addLog(LogStatus.SUCCESS, message);
// });

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

// }
