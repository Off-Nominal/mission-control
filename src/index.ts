import mcconfig from "./mcconfig";

// Discord Clients
import { contentBot, eventsBot, helperBot, ndb2Bot } from "./discord_clients";

import {
  ButtonInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Collection,
  Events,
  GuildScheduledEvent,
  GuildScheduledEventManager,
  ModalSubmitInteraction,
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
  Ndb2Events,
  NewsManagerEvents,
  RLLEvents,
  SiteListenerEvents,
  StreamHostEvents,
  HelperBotEvents,
} from "./types/eventEnums";
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
  helperBot: false,
  contentBot: false,
  eventBot: false,
  ndb2Bot: false,
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
  express: false,
};

// Database
db.connect()
  .then(() => {
    bootLog.addLog(LogStatus.SUCCESS, "Database connected");
  })
  .catch((err) => {
    console.error(err);
    bootLog.addLog(LogStatus.FAILURE, "Failure to connect to Database");
  })
  .finally(() => {
    bootChecklist.db = true;
  });

const {
  contentBotHandlers,
  devHandlers,
  eventBotHandlers,
  mainBotHandlers,
  ndb2BotHandlers,
} = generateHandlers(db);

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
 *  Express Server Setup
 ************************************/

import webhooksRouter from "./routers/webhooks";
import { NDB2API } from "./utilities/ndb2Client/types";
import db from "./db";
import api from "./api";

api.use("/webhooks", webhooksRouter(ndb2Bot, db));
api.get("*", (req, res) => res.status(404).json("Invalid Resource."));

/***********************************
 *  RLL Event Listener
 ************************************/

const launchListener = new LaunchListener(mcconfig.providers.rll.key);
launchListener.on(RLLEvents.READY, (message) => {
  bootChecklist.rllClient = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
launchListener.on(RLLEvents.BOOT_ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});
launchListener.on(RLLEvents.ERROR, (err) => {
  const logger = new Logger(
    "Rocketlaunch.live Client Error",
    LogInitiator.RLL,
    err.event
  );
  logger.addLog(LogStatus.FAILURE, err.error);
  logger.sendLog(helperBot);
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
    contentBotHandlers.handleNewContent(contentFeedItem, contentBot, "news", {
      text,
    });
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

const wmFeedListener = new ContentListener(mcconfig.content.rss.wm, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
const mecoFeedListener = new ContentListener(mcconfig.content.rss.meco, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
const ofnFeedListener = new ContentListener(mcconfig.content.rss.ofn, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
const rprFeedListener = new ContentListener(mcconfig.content.rss.rpr, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
const hlFeedListener = new ContentListener(mcconfig.content.rss.hl, {
  processor: simpleCastFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.default,
});
const hhFeedListener = new ContentListener(mcconfig.content.rss.ofn_hh, {
  processor: youtubeFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.youtube,
});
const ytFeedListener = new ContentListener(mcconfig.content.rss.ofn_yt, {
  processor: youtubeFeedMapper,
  searchOptions: mcconfig.content.rss.searchOptions.youtube,
});

/***********************************
 *  UTILITY SETUPS
 ************************************/

const reportGenerator = new ReportGenerator();

/***********************************
 *  ASYNC LOGINS/INITS
 ************************************/

wmFeedListener.initialize();
mecoFeedListener.initialize();
ofnFeedListener.initialize();
rprFeedListener.initialize();
hlFeedListener.initialize();
hhFeedListener.initialize();
ytFeedListener.initialize();

starshipChecker.initialize();

/***********************************
 *  NDB2 Bot Event Handlers
 ************************************/

ndb2Bot.once("ready", ndb2BotHandlers.handleReady);
ndb2Bot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "NDB2 Bot ready");
  bootChecklist.ndb2Bot = true;
});
ndb2Bot.on(Events.InteractionCreate, (interaction) => {
  ndb2BotHandlers.handleInteractionCreate(interaction);
});
ndb2Bot.on("error", handleError);
ndb2Bot.on(Ndb2Events.NEW_PREDICTION, (interaction: ModalSubmitInteraction) => {
  ndb2BotHandlers.handleNewPrediction(interaction);
});
ndb2Bot.on(
  Ndb2Events.VIEW_PREDICTION,
  (
    interaction: ChatInputCommandInteraction<CacheType>,
    prediction: NDB2API.EnhancedPrediction
  ) => {
    ndb2BotHandlers.handleViewPrediction(interaction, prediction);
  }
);
ndb2Bot.on(
  Ndb2Events.VIEW_DETAILS,
  (interaction: ButtonInteraction, predictionId: string, season: boolean) => {
    ndb2BotHandlers.handleViewDetails(interaction, predictionId, season);
  }
);
ndb2Bot.on(
  Ndb2Events.NEW_BET,
  (interaction: ButtonInteraction, predictionId: string, command: string) => {
    ndb2BotHandlers.handleNewBet(interaction, predictionId, command);
  }
);
ndb2Bot.on(
  Ndb2Events.RETIRE_PREDICTION,
  (interaction: ButtonInteraction, predictionId: string) => {
    ndb2BotHandlers.handleRetirePrediction(interaction, predictionId);
  }
);
ndb2Bot.on(
  Ndb2Events.TRIGGER_PREDICTION,
  (
    interaction: ButtonInteraction,
    predictionId: string,
    closed_date?: string
  ) => {
    ndb2BotHandlers.handleTriggerPrediction(
      interaction,
      predictionId,
      closed_date
    );
  }
);
ndb2Bot.on(
  Ndb2Events.NEW_VOTE,
  (interaction: ButtonInteraction, predictionId: string, command: string) => {
    ndb2BotHandlers.handleNewVote(interaction, predictionId, command);
  }
);
ndb2Bot.on(
  Ndb2Events.VIEW_SCORE,
  (interaction: ChatInputCommandInteraction<CacheType>) => {
    ndb2BotHandlers.handleViewScore(interaction);
  }
);
ndb2Bot.on(
  Ndb2Events.LIST_PREDICTIONS,
  (interaction: ChatInputCommandInteraction<CacheType>) => {
    ndb2BotHandlers.handleListPredictions(interaction);
  }
);
ndb2Bot.on(
  Ndb2Events.SEARCH_PREDICTIONS,
  (interaction: ChatInputCommandInteraction<CacheType>) => {
    ndb2BotHandlers.handleSearchPredictions(interaction);
  }
);
ndb2Bot.on(
  Ndb2Events.VIEW_LEADERBOARDS,
  (interaction: ChatInputCommandInteraction<CacheType>) => {
    ndb2BotHandlers.handleViewLeaderboards(interaction);
  }
);

/***********************************
 *  Utility Bot Event Handlers
 ************************************/

helperBot.once("ready", mainBotHandlers.handleReady);
helperBot.once("ready", scheduleThreadDigest);
helperBot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "Main Bot ready");
  bootChecklist.helperBot = true;
});
helperBot.on("messageCreate", mainBotHandlers.handleMessageCreate);
helperBot.on("guildMemberUpdate", mainBotHandlers.handleGuildMemberUpdate);
helperBot.on("messageReactionAdd", mainBotHandlers.handleMessageReactionAdd);
helperBot.on("threadCreate", mainBotHandlers.handleThreadCreate);
helperBot.on("interactionCreate", (interaction) => {
  mainBotHandlers.handleInteractionCreate(interaction);
});
helperBot.on("error", handleError);
helperBot.on(
  HelperBotEvents.SEND_DELINQUENTS,
  mainBotHandlers.handleSendDelinquents
);
helperBot.on(
  HelperBotEvents.SUMMARY_CREATE,
  (interaction: ChatInputCommandInteraction) => {
    reportGenerator.handleReportRequest(interaction);
  }
);
helperBot.on(HelperBotEvents.SUMMARY_SEND, reportGenerator.handleSendRequest);
helperBot.on(
  HelperBotEvents.THREAD_DIGEST_SEND,
  mainBotHandlers.handleThreadDigestSend
);
helperBot.on(
  HelperBotEvents.STARSHIP_UPDATE,
  mainBotHandlers.handleStarshipSiteUpdate
);

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

eventsBot.once("ready", eventBotHandlers.handleReady);
eventsBot.once("ready", () => {
  bootLog.addLog(LogStatus.SUCCESS, "Event Bot ready");
  bootChecklist.eventBot = true;
});
eventsBot.on(
  "guildScheduledEventUpdate",
  eventBotHandlers.handleGuildScheduledEventUpdate
);
eventsBot.on(
  "guildScheduledEventCreate",
  eventBotHandlers.handleGuildScheduledEventCreate
);
eventsBot.on("guildScheduledEventUpdate", eventsListener.updateEvent);
eventsBot.on("guildScheduledEventUpdate", (oldEvent, newEvent) => {
  launchListener.clearEvent(oldEvent, newEvent);
});
eventsBot.on("guildScheduledEventCreate", eventsListener.addEvent);
eventsBot.on("guildScheduledEventDelete", eventsListener.cancelEvent);

eventsBot.on(EventBotEvents.START, ytFeedListener.verifyEvent);
eventsBot.on(EventBotEvents.END, (event) =>
  contentBotHandlers.handleEventEnded(event, contentBot, feeds)
);
eventsBot.on(EventBotEvents.END, ytFeedListener.verifyEvent);

eventsBot.on("interactionCreate", (interaction) => {
  eventBotHandlers.handleInteractionCreate(interaction);
});
eventsBot.on(EventBotEvents.RETRIEVED, eventsListener.initialize);
eventsBot.on(
  EventBotEvents.RETRIEVED,
  (
    events: Collection<string, GuildScheduledEvent>,
    eventManager: GuildScheduledEventManager
  ) => launchListener.initialize(events, eventManager)
);
eventsBot.on("error", handleError);
eventsBot.on(EventBotEvents.NEW_TITLE, streamHost.logSuggestion);
eventsBot.on(EventBotEvents.VIEW_TITLES, streamHost.viewSuggestions);

/***********************************
 *  Feed Listeners Event Handlers
 ************************************/

wmFeedListener.on(ContentListnerEvents.NEW, (content) => {
  deployWeMartians();
  setTimeout(() => {
    contentBotHandlers.handleNewContent(content, contentBot, "content");
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
  contentBotHandlers.handleNewContent(content, contentBot, "content");
});
mecoFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.mecoFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
mecoFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

ofnFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(content, contentBot, "content");
});
ofnFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.ofnFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
ofnFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

rprFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(content, contentBot, "content");
});
rprFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.rprFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
rprFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

hlFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(content, contentBot, "content");
});
hlFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.hlFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
hlFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

hhFeedListener.on(ContentListnerEvents.NEW, (content) => {
  eventBotHandlers.handleNewContent(content, eventsBot);
});
hhFeedListener.on(ContentListnerEvents.READY, (message) => {
  bootChecklist.hhFeedListener = true;
  bootLog.addLog(LogStatus.SUCCESS, message);
});
hhFeedListener.on(ContentListnerEvents.ERROR, (message) => {
  bootLog.addLog(LogStatus.FAILURE, message);
});

ytFeedListener.on(ContentListnerEvents.NEW, (content) => {
  eventBotHandlers.handleNewContent(content, eventsBot);
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
  helperBot.emit(HelperBotEvents.STARSHIP_UPDATE, update)
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
    bootLog.sendLog(helperBot);
    console.log("*** BOOTUP COMPLETE ***");
    clearInterval(bootChecker);
  } else {
    bootLogAttempts++;
  }

  if (bootLogAttempts > 15) {
    let failures = "";

    for (const item in bootChecklist) {
      if (!bootChecklist[item]) {
        failures += `- ❌: ${item}`;
      }
    }

    bootLog.addLog(
      LogStatus.FAILURE,
      `Boot Checklist still incomplete after 15 attempts, logger aborted. Failed items:\n${failures}`
    );
    bootLog.sendLog(helperBot);
    console.log("*** BOOTUP FAILURE CHECK LOGS ***");
    clearInterval(bootChecker);
  }
}, 1000);

/***********************************
 *  Dev Test Event Handlers
 *  Only runs in Dev environment
 *  to enable simulated events
 ************************************/

if (mcconfig.env === "dev") {
  helperBot.on("messageCreate", devHandlers.handleMessageCreate);

  helperBot.on(DevEvents.NEW_ENTRIES, (show) => {
    const feed = feeds[show] as ContentListener;
    feed.emit(ContentListnerEvents.NEW, feed.fetchRecent());
  });
  helperBot.on(DevEvents.DB_TEST, () => {
    console.log("dbtest invoked");
    db.query("SELECT NOW()")
      .then((res) => console.log(`Time on database is ${res.rows[0].now}`))
      .catch((err) => {
        console.error("Could not connect to db");
        console.error(err);
      });
  });

  helperBot.on(
    DevEvents.THREAD_DIGEST_SEND,
    mainBotHandlers.handleThreadDigestSend
  );
}
