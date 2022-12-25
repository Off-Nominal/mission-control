require("dotenv").config();
import { Client as DbClient } from "pg";

import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  GatewayIntentBits,
  GuildScheduledEvent,
  GuildScheduledEventManager,
  Partials,
} from "discord.js";

import generateHandlers from "./clients/handlers";

import { SiteListener } from "./listeners/siteListener";
import { ReportGenerator } from "./utilities/ReportGenerator";
import {
  youtubeFeedMapper,
  simpleCastFeedMapper,
} from "./listeners/feedListener/mappers";
import { EventsListener } from "./listeners/eventsListener/EventsListener";
import { StreamHost } from "./listeners/streamHost/streamHost";

import deployWeMartians from "./utilities/deployWeMartians";
import handleError from "./clients/actions/handleError";
import scheduleThreadDigest from "./utilities/scheduleThreadDigest";
import { MemberManager } from "./listeners/memberManager/memberManager";
import { NewsManager } from "./listeners/newsManager/newsManager";
import { ContentListener } from "./listeners/contentListener/contentListener";
import { ContentFeedItem } from "./clients/content/handlers/handleNewContent";

import {
  ContentBotEvents,
  ContentListnerEvents,
  DevEvents,
  EventBotEvents,
  EventListenerEvents,
  MemberManagerEvents,
  NewsManagerEvents,
  RLLEvents,
  SiteListenerEvents,
  StreamHostEvents,
  UtilityBotEvents,
} from "./types/eventEnums";
import { SpecificChannel } from "./types/channelEnums";
import LaunchListener from "./listeners/launchListener/launchListener";
import { Logger, LogStatus } from "./utilities/logger";
import { LogInitiator } from "./types/logEnums";

// Boot Logger
console.log("*** BOOTING... ***");
const bootLog = new Logger(
  "Application Bootup Log",
  LogInitiator.SERVER,
  "Bootup"
);
bootLog.addLog(LogStatus.INFO, "Off-Nominal Discord App in Startup.");

const bootChecklist = {
  db: false,
  utilityBot: false,
  bcBot: false,
  contentBot: false,
  eventBot: false,
  starshipSiteChecker: false,
  wmFeedListener: false,
  mecoFeedListener: false,
  ofnFeedListener: false,
  rprFeedListener: false,
  hlFeedListener: false,
  hhFeedListener: false,
  ytFeedListener: false,
  eventsListener: false,
  newsFeed: false,
  rllClient: false,
};

// Database Config
const db = new DbClient();
db.connect()
  .then(() => {
    bootLog.addLog(LogStatus.SUCCESS, "Database connected");
  })
  .catch((err) => {
    bootLog.addLog(LogStatus.FAILURE, "Failure to connect to Database");
  })
  .finally(() => {
    bootChecklist.db = true;
  });

const {
  bookClubBotHandlers,
  contentBotHandlers,
  devHandlers,
  eventBotHandlers,
  mainBotHandlers,
} = generateHandlers(db);

const searchOptions = require("../config/searchOptions.json");

const RLL_KEY = process.env.RLL_KEY;

const WMFEED = process.env.WMFEED;
const MECOFEED = process.env.MECOFEED;
const OFNFEED = process.env.OFNFEED;
const RPRFEED = process.env.RPRFEED;
const HLFEED = process.env.HLFEED;
const OFN_YT_FEED = process.env.OFN_YT_FEED;
const HHFEED = process.env.HHFEED;

const UTILITY_TOKEN = process.env.UTILITY_BOT_TOKEN_ID;
const BC_TOKEN = process.env.BOOK_CLUB_BOT_TOKEN_ID;
const CONTENT_TOKEN = process.env.CONTENT_BOT_TOKEN_ID;
const EVENT_TOKEN = process.env.EVENT_BOT_TOKEN_ID;

const WM_SEARCH_OPTIONS = searchOptions.wm || searchOptions.default;
const MECO_SEARCH_OPTIONS = searchOptions.meco || searchOptions.default;
const OFN_SEARCH_OPTIONS = searchOptions.ofn || searchOptions.default;
const RPR_SEARCH_OPTIONS = searchOptions.rpr || searchOptions.default;
const HL_SEARCH_OPTIONS = searchOptions.hl || searchOptions.default;
const HH_SEARCH_OPTIONS = searchOptions.youtube || searchOptions.default;
const YT_SEARCH_OPTIONS = searchOptions.youtube || searchOptions.default;

export enum Feed {
  WEMARTIANS = "wm",
  MAIN_ENGINE_CUT_OFF = "meco",
  OFF_NOMINAL_PODCAST = "ofn",
  RED_PLANET_REVIEW = "rpr",
  MECO_HEADLINES = "hl",
  OFF_NOMINAL_YOUTUBE = "yt",
  HAPPY_HOUR = "hh",
}

export type FeedList = {
  [Feed.WEMARTIANS]: ContentListener;
  [Feed.MAIN_ENGINE_CUT_OFF]: ContentListener;
  [Feed.OFF_NOMINAL_PODCAST]: ContentListener;
  [Feed.RED_PLANET_REVIEW]: ContentListener;
  [Feed.HAPPY_HOUR]: ContentListener;
  [Feed.MECO_HEADLINES]: ContentListener;
  [Feed.OFF_NOMINAL_YOUTUBE]: ContentListener;
};

/***********************************
 *  Bot Setup
 ************************************/

const simpleIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.DirectMessages,
];
const utilityIntents = [
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.MessageContent,
];
const eventIntents = [GatewayIntentBits.GuildScheduledEvents];

const utilityBot = new Client({
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
  intents: [simpleIntents, utilityIntents],
});
const bcBot = new Client({
  intents: simpleIntents,
});
const contentBot = new Client({
  intents: simpleIntents,
});
const eventBot = new Client({
  intents: [simpleIntents, eventIntents],
});

/***********************************
 *  RLL Event Listener
 ************************************/

const launchListener = new LaunchListener(RLL_KEY);
launchListener.on(RLLEvents.READY, (message) => {
  bootChecklist.rllClient = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
launchListener.on(RLLEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

/***********************************
 *  Site Listener Setup
 ************************************/

const starshipURL = "https://www.spacex.com/vehicles/starship/";

const starshipChecker = new SiteListener(starshipURL, {
  interval: 15,
  cooldown: 600,
});

/***********************************
 *  News Feed Listener Setup
 ************************************/

const newsFeedListener = new NewsManager();
newsFeedListener.initialize();
newsFeedListener.on(
  NewsManagerEvents.NEW,
  (contentFeedItem: ContentFeedItem, text: string) => {
    contentBotHandlers.handleNewContent(
      contentFeedItem,
      contentBot,
      SpecificChannel.NEWS,
      {
        text,
      }
    );
  }
);
newsFeedListener.on(NewsManagerEvents.READY, (message) => {
  bootChecklist.newsFeed = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
newsFeedListener.on(NewsManagerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

/***********************************
 *  Events Listener Setup
 ************************************/

const eventsListener = new EventsListener();
const streamHost = new StreamHost();

/***********************************
 *  Member Manager Setup
 ************************************/

// const memberManager = new MemberManager();
// memberManager.on(MemberManagerEvents.SEND_DELINQUENTS, () => {
//   mainBotHandlers.handleSendDelinquents(utilityBot);
// });

/***********************************
 *  Feed Listener Setup
 ************************************/

const wmFeedListener = new ContentListener(WMFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: WM_SEARCH_OPTIONS,
});
const mecoFeedListener = new ContentListener(MECOFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: MECO_SEARCH_OPTIONS,
});
const ofnFeedListener = new ContentListener(OFNFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: OFN_SEARCH_OPTIONS,
});
const rprFeedListener = new ContentListener(RPRFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: RPR_SEARCH_OPTIONS,
});
const hlFeedListener = new ContentListener(HLFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: HL_SEARCH_OPTIONS,
});
const hhFeedListener = new ContentListener(HHFEED, {
  processor: youtubeFeedMapper,
  searchOptions: HH_SEARCH_OPTIONS,
});
const ytFeedListener = new ContentListener(OFN_YT_FEED, {
  processor: youtubeFeedMapper,
  searchOptions: YT_SEARCH_OPTIONS,
});

/***********************************
 *  UTILITY SETUPS
 ************************************/

const reportGenerator = new ReportGenerator();

/***********************************
 *  ASYNC LOGINS/INITS
 ************************************/

utilityBot.login(UTILITY_TOKEN);
bcBot.login(BC_TOKEN);
contentBot.login(CONTENT_TOKEN);
eventBot.login(EVENT_TOKEN);

wmFeedListener.initialize();
mecoFeedListener.initialize();
ofnFeedListener.initialize();
rprFeedListener.initialize();
hlFeedListener.initialize();
hhFeedListener.initialize();
ytFeedListener.initialize();

starshipChecker.initialize();

/***********************************
 *  Utility Bot Event Handlers
 ************************************/

utilityBot.once("ready", mainBotHandlers.handleReady);
utilityBot.once("ready", scheduleThreadDigest);
utilityBot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "Main Bot ready");
  bootChecklist.utilityBot = true;
});
utilityBot.on("messageCreate", mainBotHandlers.handleMessageCreate);
utilityBot.on("guildMemberAdd", mainBotHandlers.handleGuildMemberAdd);
utilityBot.on("messageReactionAdd", mainBotHandlers.handleMessageReactionAdd);
utilityBot.on("threadCreate", mainBotHandlers.handleThreadCreate);
utilityBot.on("interactionCreate", (interaction) => {
  mainBotHandlers.handleInteractionCreate(interaction);
});
utilityBot.on("error", handleError);
utilityBot.on(
  UtilityBotEvents.SEND_DELINQUENTS,
  mainBotHandlers.handleSendDelinquents
);
utilityBot.on(
  UtilityBotEvents.SUMMARY_CREATE,
  (interaction: ChatInputCommandInteraction) => {
    reportGenerator.handleReportRequest(interaction);
  }
);
utilityBot.on(UtilityBotEvents.SUMMARY_SEND, reportGenerator.handleSendRequest);
utilityBot.on(
  UtilityBotEvents.THREAD_DIGEST_SEND,
  mainBotHandlers.handleThreadDigestSend
);
utilityBot.on(
  UtilityBotEvents.STARSHIP_UPDATE,
  mainBotHandlers.handleStarshipSiteUpdate
);

/***********************************
 *  Book Club Bot Event Handlers
 ************************************/

bcBot.once("ready", bookClubBotHandlers.handleReady);
bcBot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "Book Club Bot ready");
  bootChecklist.bcBot = true;
});
bcBot.on("messageCreate", bookClubBotHandlers.handleMessageCreate);
bcBot.on("threadCreate", bookClubBotHandlers.handleThreadCreate);
bcBot.on("interactionCreate", (interaction) => {
  bookClubBotHandlers.handleInteractionCreate(interaction);
});
bcBot.on("error", handleError);

/***********************************
 *  Content Bot Event Handlers
 ************************************/

const feeds: FeedList = {
  wm: wmFeedListener,
  meco: mecoFeedListener,
  ofn: ofnFeedListener,
  rpr: rprFeedListener,
  hl: hlFeedListener,
  hh: hhFeedListener,
  yt: ytFeedListener,
};
contentBot.once("ready", contentBotHandlers.handleReady);
contentBot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "Content Bot ready");
  bootChecklist.contentBot = true;
});
contentBot.on("threadCreate", contentBotHandlers.handleThreadCreate);
contentBot.on("interactionCreate", (interaction) => {
  contentBotHandlers.handleInteractionCreate(interaction, feeds);
});
contentBot.on("error", handleError);
contentBot.on(ContentBotEvents.RSS_LIST, contentBotHandlers.handleRssList);

/***********************************
 *  Event Bot Event Handlers
 ************************************/

eventBot.once("ready", eventBotHandlers.handleReady);
eventBot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "Event Bot ready");
  bootChecklist.eventBot = true;
});
eventBot.on(
  "guildScheduledEventUpdate",
  eventBotHandlers.handleGuildScheduledEventUpdate
);
eventBot.on(
  "guildScheduledEventCreate",
  eventBotHandlers.handleGuildScheduledEventCreate
);
eventBot.on("guildScheduledEventUpdate", eventsListener.updateEvent);
eventBot.on("guildScheduledEventCreate", eventsListener.addEvent);
eventBot.on("guildScheduledEventDelete", eventsListener.cancelEvent);

eventBot.on(EventBotEvents.START, ytFeedListener.verifyEvent);
eventBot.on(EventBotEvents.END, (event) =>
  contentBotHandlers.handleEventEnded(event, contentBot, feeds)
);
eventBot.on(EventBotEvents.END, ytFeedListener.verifyEvent);

eventBot.on("interactionCreate", (interaction) => {
  eventBotHandlers.handleInteractionCreate(interaction);
});
eventBot.on(EventBotEvents.RETRIEVED, eventsListener.initialize);
eventBot.on(
  EventBotEvents.RETRIEVED,
  (
    events: Collection<string, GuildScheduledEvent>,
    eventManager: GuildScheduledEventManager
  ) => launchListener.initialize(events, eventManager)
);
eventBot.on("error", handleError);
eventBot.on(EventBotEvents.NEW_TITLE, streamHost.logSuggestion);
eventBot.on(EventBotEvents.VIEW_TITLES, streamHost.viewSuggestions);

/***********************************
 *  Feed Listeners Event Handlers
 ************************************/

wmFeedListener.on(ContentListnerEvents.NEW, (content) => {
  deployWeMartians();
  setTimeout(() => {
    contentBotHandlers.handleNewContent(
      content,
      contentBot,
      SpecificChannel.CONTENT
    );
  }, 600000);
});
wmFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.wmFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
wmFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

mecoFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
mecoFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.mecoFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
mecoFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

ofnFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
ofnFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.ofnFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
ofnFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

rprFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
rprFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.rprFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
rprFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

hlFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
hlFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.hlFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
hlFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

hhFeedListener.on(ContentListnerEvents.NEW, (content) => {
  eventBotHandlers.handleNewContent(content, eventBot);
});
hhFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.hhFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
hhFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

ytFeedListener.on(ContentListnerEvents.NEW, (content) => {
  eventBotHandlers.handleNewContent(content, eventBot);
});
ytFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.ytFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
ytFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

ytFeedListener.on(ContentListnerEvents.STREAM_START, streamHost.startParty);
ytFeedListener.on(ContentListnerEvents.STREAM_END, streamHost.endParty);

/***********************************
 *  Event Listeners Event Handlers
 ************************************/

eventsListener.on(
  EventListenerEvents.MONITOR,
  eventBotHandlers.handleEventsMonitored
);
eventsListener.on(EventListenerEvents.READY, (message) => {
  bootChecklist.eventsListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});

streamHost.on(
  StreamHostEvents.PARTY_MESSAGE,
  eventBotHandlers.handlePartyMessage
);

/***********************************
 *  Site Listeners Event Handlers
 ************************************/

starshipChecker.on(SiteListenerEvents.READY, () => {
  bootChecklist.starshipSiteChecker = true;
  bootLog.addLog(
    LogStatus.SUCCESS,
    `Site listener monitoring Starship Website`
  );
});
starshipChecker.on(SiteListenerEvents.UPDATE, (update) =>
  utilityBot.emit(UtilityBotEvents.STARSHIP_UPDATE, update)
);

/***********************************
 *  Boot Logger
 ************************************/

let bootLogAttempts = 0;
const bootChecker = setInterval(() => {
  let booted = true;

  for (const item in bootChecklist) {
    if (!bootChecklist[item]) {
      booted = false;
      break;
    }
  }

  if (booted) {
    bootLog.addLog(
      LogStatus.SUCCESS,
      "Boot Checklist complete. The Off-Nominal Discord Bot is online."
    );
    bootLog.sendLog(utilityBot);
    console.log("*** BOOTUP COMPLETE ***");
    clearInterval(bootChecker);
  } else {
    bootLogAttempts++;
  }

  if (bootLogAttempts > 15) {
    let failures: string;

    for (const item in bootChecklist) {
      if (!bootChecklist[item]) {
        failures += `- ❌: ${item}`;
      }
    }

    bootLog.addLog(
      LogStatus.FAILURE,
      `Boot Checklist still incomplete after 15 attempts, logger aborted. Failed items:\n${failures}`
    );
    bootLog.sendLog(utilityBot);
    console.log("*** BOOTUP FAILURE CHECK LOGS ***");
    clearInterval(bootChecker);
  }
}, 1000);

/***********************************
 *  Dev Test Event Handlers
 *  Only runs in Dev environment
 *  to enable simulated events
 ************************************/

if (process.env.NODE_ENV === "dev") {
  utilityBot.on("messageCreate", devHandlers.handleMessageCreate);

  utilityBot.on(DevEvents.NEW_ENTRIES, (show) => {
    const feed = feeds[show] as ContentListener;
    feed.emit(ContentListnerEvents.NEW, feed.fetchRecent());
  });
  utilityBot.on(DevEvents.DB_TEST, () => {
    console.log("dbtest invoked");
    db.query("SELECT NOW()")
      .then((res) => console.log(`Time on database is ${res.rows[0].now}`))
      .catch((err) => {
        console.error("Could not connect to db");
        console.error(err);
      });
  });

  utilityBot.on(
    DevEvents.THREAD_DIGEST_SEND,
    mainBotHandlers.handleThreadDigestSend
  );
}
