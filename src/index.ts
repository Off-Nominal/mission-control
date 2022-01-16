require("dotenv").config();
import { Client as DbClient } from "pg";
import { Client, Intents } from "discord.js";

import bcBotHandlers from "./clients/bookclub/handlers";
import mainBotHandlers from "./clients/main/handlers";
import contentBotHandlers from "./clients/content/handlers";
import eventBotHandlers from "./clients/event/handlers";
import devHandlers from "./clients/dev/handlers";

import { FeedListener } from "./listeners/feedListener/feedListener";
import { SiteListener } from "./listeners/siteListener";
import { ReportGenerator } from "./utilities/ReportGenerator";
import {
  youtubeFeedMapper,
  simpleCastFeedMapper,
} from "./listeners/feedListener/mappers";
import deployWeMartians from "./utilities/deployWeMartians";

// Database Config
const db = new DbClient();
db.connect();

const searchOptions = require("../config/searchOptions.json");

const TEST_CHANNEL = process.env.TESTCHANNEL;

const BOCACHICACHANNELID = process.env.BOCACHICACHANNELID || TEST_CHANNEL;

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
  [Feed.WEMARTIANS]: FeedListener;
  [Feed.MAIN_ENGINE_CUT_OFF]: FeedListener;
  [Feed.OFF_NOMINAL_PODCAST]: FeedListener;
  [Feed.RED_PLANET_REVIEW]: FeedListener;
  [Feed.HAPPY_HOUR]: FeedListener;
  [Feed.MECO_HEADLINES]: FeedListener;
  [Feed.OFF_NOMINAL_YOUTUBE]: FeedListener;
};

/***********************************
 *  Bot Setup
 ************************************/

const simpleIntents = new Intents();
const utilityIntents = new Intents();
const eventIntents = new Intents();

simpleIntents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.DIRECT_MESSAGES
);

utilityIntents.add(
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS
);

eventIntents.add(Intents.FLAGS.GUILD_SCHEDULED_EVENTS);

const utilityBot = new Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER"],
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
 *  Site Listener Setup
 ************************************/

const starshipChecker = new SiteListener(
  "https://www.spacex.com/vehicles/starship/",
  utilityBot,
  BOCACHICACHANNELID,
  { interval: 15, cooldown: 600 }
);

/***********************************
 *  Feed Listener Setup
 ************************************/

const wmFeedListener = new FeedListener(WMFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: WM_SEARCH_OPTIONS,
});
const mecoFeedListener = new FeedListener(MECOFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: MECO_SEARCH_OPTIONS,
});
const ofnFeedListener = new FeedListener(OFNFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: OFN_SEARCH_OPTIONS,
});
const rprFeedListener = new FeedListener(RPRFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: RPR_SEARCH_OPTIONS,
});
const hlFeedListener = new FeedListener(HLFEED, {
  processor: simpleCastFeedMapper,
  searchOptions: HL_SEARCH_OPTIONS,
});
const hhFeedListener = new FeedListener(HHFEED, {
  processor: youtubeFeedMapper,
  searchOptions: HH_SEARCH_OPTIONS,
});
const ytFeedListener = new FeedListener(OFN_YT_FEED, {
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
utilityBot.on("messageCreate", mainBotHandlers.handleMessageCreate);
utilityBot.on("guildMemberAdd", mainBotHandlers.handleGuildMemberAdd);
utilityBot.on("messageReactionAdd", mainBotHandlers.handleMessageReactionAdd);
utilityBot.on("threadCreate", mainBotHandlers.handleThreadCreate);
utilityBot.on("interactionCreate", mainBotHandlers.handleInteractionCreate);
utilityBot.on("summaryReportCreate", reportGenerator.handleReportRequest);
utilityBot.on("summaryReportSend", reportGenerator.handleSendRequest);

if (process.env.NODE_ENV === "dev") {
  utilityBot.on("messageCreate", devHandlers.handleMessageCreate);
}

/***********************************
 *  Book Club Bot Event Handlers
 ************************************/

bcBot.once("ready", bcBotHandlers.handleReady);
bcBot.on("messageCreate", bcBotHandlers.handleMessageCreate);
bcBot.on("threadCreate", bcBotHandlers.handleThreadCreate);
bcBot.on("interactionCreate", bcBotHandlers.handleInteractionCreate);

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
contentBot.on("interactionCreate", (interaction) =>
  contentBotHandlers.handleInteractionCreate(interaction, feeds)
);

/***********************************
 *  Event Bot Event Handlers
 ************************************/

eventBot.once("ready", eventBotHandlers.handleReady);
eventBot.on(
  "guildScheduledEventUpdate",
  eventBotHandlers.handleGuildScheduledEventUpdate
);
eventBot.on("eventEnded", (event) =>
  contentBotHandlers.handleEventEnded(event, contentBot, feeds)
);
eventBot.on("interactionCreate", eventBotHandlers.handleInteractionCreate);

/***********************************
 *  Feed Listeners Event Handlers
 ************************************/

wmFeedListener.on("newContent", (content) => {
  deployWeMartians();
  contentBotHandlers.handleNewContent(content, contentBot, 600);
});
mecoFeedListener.on("newContent", (content) => {
  contentBotHandlers.handleNewContent(content, contentBot);
});
ofnFeedListener.on("newContent", (content) => {
  contentBotHandlers.handleNewContent(content, contentBot);
});
rprFeedListener.on("newContent", (content) => {
  contentBotHandlers.handleNewContent(content, contentBot);
});
hlFeedListener.on("newContent", (content) => {
  contentBotHandlers.handleNewContent(content, contentBot);
});
hhFeedListener.on("newContent", (content) => {
  eventBotHandlers.handleNewContent(content, eventBot);
});
ytFeedListener.on("newContent", (content) => {
  eventBotHandlers.handleNewContent(content, eventBot);
});

/***********************************
 *  Dev Test Event Handlers
 *  Only runs in Dev environment
 *  to enable simulated events
 ************************************/

if (process.env.NODE_ENV === "dev") {
  utilityBot.on("dev_new entries", (show) => {
    const feed = feeds[show] as FeedListener;
    feed.emit("newContent", feed.fetchRecent());
  });
  utilityBot.on("dev_dbtest", () => {
    console.log("dbtest invoked");
    db.query("SELECT NOW()")
      .then((res) => console.log(`Time on database is ${res.rows[0].now}`))
      .catch((err) => {
        console.error("Could not connect to db");
        console.error(err);
      });
  });
}
