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
  SiteListenerEvents,
  StreamHostEvents,
  UtilityBotEvents,
} from "./types/eventEnums";
import { SpecificChannel } from "./types/channelEnums";
import LaunchListener from "./listeners/launchListener/launchListener";

// Database Config
const db = new DbClient();
db.connect();

const {
  bookClubBotHandlers,
  contentBotHandlers,
  devHandlers,
  eventBotHandlers,
  mainBotHandlers,
  ndb2BotHandlers,
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
const NDB2_TOKEN = process.env.NDB2_BOT_TOKEN_ID;

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
const ndb2Bot = new Client({ intents: [simpleIntents] });

/***********************************
 *  RLL Event Listener
 ************************************/

const launchListener = new LaunchListener(RLL_KEY);

/***********************************
 *  Site Listener Setup
 ************************************/

const starshipChecker = new SiteListener(
  "https://www.spacex.com/vehicles/starship/",
  { interval: 15, cooldown: 600 }
);

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
ndb2Bot.login(NDB2_TOKEN);

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

/***********************************
 *  Utility Bot Event Handlers
 ************************************/

utilityBot.once("ready", mainBotHandlers.handleReady);
utilityBot.once("ready", scheduleThreadDigest);
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
mecoFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
ofnFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
rprFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
hlFeedListener.on(ContentListnerEvents.NEW, (content) => {
  contentBotHandlers.handleNewContent(
    content,
    contentBot,
    SpecificChannel.CONTENT
  );
});
hhFeedListener.on(ContentListnerEvents.NEW, (content) => {
  eventBotHandlers.handleNewContent(content, eventBot);
});
ytFeedListener.on(ContentListnerEvents.NEW, (content) => {
  eventBotHandlers.handleNewContent(content, eventBot);
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
streamHost.on(
  StreamHostEvents.PARTY_MESSAGE,
  eventBotHandlers.handlePartyMessage
);

/***********************************
 *  Site Listeners Event Handlers
 ************************************/

starshipChecker.on(SiteListenerEvents.UPDATE, (update) =>
  utilityBot.emit(UtilityBotEvents.STARSHIP_UPDATE, update)
);

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
