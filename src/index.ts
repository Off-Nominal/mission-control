require("dotenv").config();
const Discord = require("discord.js");

import { Client, Message } from "discord.js";
import onbListeners from "./utilityActions/";
import utilityListeners from "./utilityListeners/";
import bcbListeners from "./bcbListeners";
import { SiteMonitor } from "./utilityListeners/siteMonitor";
import { FeedListener } from "./feeds/feedListener";
import { feedMapper } from "./feeds/feedMapper";
import feedActions from "./feedActions";
const searchOptions = require("../config/searchOptions.json");

const TEST_CHANNEL = process.env.TESTCHANNEL;
const TESTCONTENTCHANNEL = process.env.TESTCONTENTCHANNEL;

const BOCACHICACHANNELID = process.env.BOCACHICACHANNELID || TEST_CHANNEL;
const CONTENTCHANNELID = process.env.CONTENTCHANNELID || TESTCONTENTCHANNEL;

const WMFEED = process.env.WMFEED;
const MECOFEED = process.env.MECOFEED;
const OFNFEED = process.env.OFNFEED;
const RPRFEED = process.env.RPRFEED;
const HLFEED = process.env.HLFEED;

const UTILITY_TOKEN = process.env.UTILITY_BOT_TOKEN_ID;
const BC_TOKEN = process.env.BOOK_CLUB_BOT_TOKEN_ID;
const WM_TOKEN = process.env.WEMARTIANS_BOT_TOKEN_ID;
const MECO_TOKEN = process.env.MECO_BOT_TOKEN_ID;
const OFN_TOKEN = process.env.OFFNOM_BOT_TOKEN_ID;
const RPR_TOKEN = process.env.RPR_BOT_TOKEN_ID;
const HL_TOKEN = process.env.HL_BOT_TOKEN_ID;

const WM_SEARCH_OPTIONS = searchOptions.wm || searchOptions.default;
const MECO_SEARCH_OPTIONS = searchOptions.meco || searchOptions.default;
const OFN_SEARCH_OPTIONS = searchOptions.ofn || searchOptions.default;
const RPR_SEARCH_OPTIONS = searchOptions.rpr || searchOptions.default;
const HL_SEARCH_OPTIONS = searchOptions.hl || searchOptions.default;

/***********************************
 *  Bot Setup
 ************************************/

const utilityBot: Client = new Discord.Client();
const bcBot: Client = new Discord.Client();
const wmBot: Client = new Discord.Client();
const ofnBot: Client = new Discord.Client();
const mecoBot: Client = new Discord.Client();
const rprBot: Client = new Discord.Client();
const hlBot: Client = new Discord.Client();

/***********************************
 *  Site Listener Setup
 ************************************/

const starshipChecker = new SiteMonitor(
  "https://www.spacex.com/vehicles/starship/",
  utilityBot,
  BOCACHICACHANNELID,
  { interval: 15, cooldown: 600 }
);

/***********************************
 *  Feed Listener Setup
 ************************************/

const wmFeedListener = new FeedListener(WMFEED, {
  processor: feedMapper,
  discordClient: wmBot,
  channelId: CONTENTCHANNELID,
  actionDelay: 600,
  searchOptions: WM_SEARCH_OPTIONS,
});
const mecoFeedListener = new FeedListener(MECOFEED, {
  processor: feedMapper,
  discordClient: mecoBot,
  channelId: CONTENTCHANNELID,
  searchOptions: MECO_SEARCH_OPTIONS,
});
const ofnFeedListener = new FeedListener(OFNFEED, {
  processor: feedMapper,
  discordClient: ofnBot,
  channelId: CONTENTCHANNELID,
  searchOptions: OFN_SEARCH_OPTIONS,
});
const rprFeedListener = new FeedListener(RPRFEED, {
  processor: feedMapper,
  discordClient: rprBot,
  channelId: CONTENTCHANNELID,
  searchOptions: RPR_SEARCH_OPTIONS,
});
const hlFeedListener = new FeedListener(HLFEED, {
  processor: feedMapper,
  discordClient: hlBot,
  channelId: CONTENTCHANNELID,
  searchOptions: HL_SEARCH_OPTIONS,
});

/***********************************
 *  ASYNC LOGINS/INITS
 ************************************/

utilityBot.login(UTILITY_TOKEN);
bcBot.login(BC_TOKEN);
wmBot.login(WM_TOKEN);
ofnBot.login(OFN_TOKEN);
mecoBot.login(MECO_TOKEN);
rprBot.login(RPR_TOKEN);
hlBot.login(HL_TOKEN);

wmFeedListener.initialize();
mecoFeedListener.initialize();
ofnFeedListener.initialize();
rprFeedListener.initialize();
hlFeedListener.initialize();

utilityBot.once("ready", () => {
  utilityListeners.logReady(utilityBot.user.tag);
});
bcBot.once("ready", () => {
  utilityListeners.logReady(bcBot.user.tag);
});
wmBot.once("ready", () => {
  utilityListeners.logReady(wmBot.user.tag);
  wmFeedListener.fetchChannel();
});
ofnBot.once("ready", () => {
  utilityListeners.logReady(ofnBot.user.tag);
  ofnFeedListener.fetchChannel();
});
mecoBot.once("ready", () => {
  utilityListeners.logReady(mecoBot.user.tag);
  mecoFeedListener.fetchChannel();
});
rprBot.once("ready", () => {
  utilityListeners.logReady(rprBot.user.tag);
  rprFeedListener.fetchChannel();
});
hlBot.once("ready", () => {
  utilityListeners.logReady(hlBot.user.tag);
  hlFeedListener.fetchChannel();
});

starshipChecker.initialize();

/***********************************
 *  Utility Bot Actions
 ************************************/

utilityBot.on("message", (message: Message) =>
  onbListeners.handleMessage(utilityBot, message)
);
utilityBot.on("guildMemberAdd", onbListeners.welcomeUser);

/***********************************
 *  Book Club Bot Actions
 ************************************/

bcBot.on("message", bcbListeners.handleMessage);

/***********************************
 *  Podcast Bot Actions
 ************************************/

wmBot.on("message", (message: Message) =>
  feedActions.handleMessage(message, wmFeedListener, "!wm")
);
ofnBot.on("message", (message: Message) =>
  feedActions.handleMessage(message, ofnFeedListener, "!ofn")
);
mecoBot.on("message", (message: Message) =>
  feedActions.handleMessage(message, mecoFeedListener, "!meco")
);
rprBot.on("message", (message: Message) =>
  feedActions.handleMessage(message, rprFeedListener, "!rpr")
);
hlBot.on("message", (message: Message) =>
  feedActions.handleMessage(message, hlFeedListener, "!hl")
);
