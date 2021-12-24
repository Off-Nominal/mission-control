require("dotenv").config();

import { Client, Intents } from "discord.js";

import bcBotHandlers from "./clients/bookclub/handlers";
import podcastBotHandlers from "./clients/podcast/handlers";
import mainBotHandlers from "./clients/main/handlers";

import { FeedListener } from "./listeners/feedListener/feedListener";
import { feedMapper } from "./listeners/feedListener/feedMapper";
import { SiteListener } from "./listeners/siteListener";
import { ReportGenerator } from "./utilities/ReportGenerator";
import { ChannelBabysitter } from "./utilities/channelBabysitter";

const searchOptions = require("../config/searchOptions.json");

const TEST_CHANNEL = process.env.TESTCHANNEL;
const TESTCONTENTCHANNEL = process.env.TESTCONTENTCHANNEL;

const BOCACHICACHANNELID = process.env.BOCACHICACHANNELID || TEST_CHANNEL;
const CONTENTCHANNELID = process.env.CONTENTCHANNELID || TESTCONTENTCHANNEL;
const LIVECHATCHANNELID = process.env.LIVECHATCHANNELID || TEST_CHANNEL;

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

const WM_DEPLOY_URL = process.env.WM_DEPLOY_URL;

/***********************************
 *  Bot Setup
 ************************************/

const simpleIntents = new Intents();
const utilityIntents = new Intents();

simpleIntents.add(
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.DIRECT_MESSAGES
);

utilityIntents.add(
  Intents.FLAGS.GUILD_MESSAGES,
  Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MEMBERS,
  Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  Intents.FLAGS.DIRECT_MESSAGES
);

const utilityBot = new Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER"],
  intents: utilityIntents,
});
const bcBot = new Client({
  intents: simpleIntents,
});
const wmBot = new Client({
  intents: simpleIntents,
});
const ofnBot = new Client({
  intents: simpleIntents,
});
const mecoBot = new Client({
  intents: simpleIntents,
});
const rprBot = new Client({
  intents: simpleIntents,
});
const hlBot = new Client({
  intents: simpleIntents,
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
  processor: feedMapper,
  discordClient: wmBot,
  channelId: CONTENTCHANNELID,
  actionDelay: 600,
  searchOptions: WM_SEARCH_OPTIONS,
  deployUrl: WM_DEPLOY_URL,
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
 *  UTILITY SETUPS
 ************************************/

const reportGenerator = new ReportGenerator();
const channelBabysitter = new ChannelBabysitter(utilityBot, LIVECHATCHANNELID);

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

starshipChecker.initialize();

/***********************************
 *  Utility Bot Event Handlers
 ************************************/

utilityBot.once("ready", (client) => {
  mainBotHandlers.handleReady(client);
  channelBabysitter.initialize();
});
utilityBot.on("messageCreate", (message) =>
  mainBotHandlers.handleMessageCreate(message, reportGenerator)
);
utilityBot.on("guildMemberAdd", mainBotHandlers.handleGuildMemberAdd);
utilityBot.on("messageReactionAdd", (messageReact, user) => {
  mainBotHandlers.handleMessageReactionAdd(messageReact, user, {
    reportGenerator,
    channelBabysitter,
  });
});
utilityBot.on("threadCreate", mainBotHandlers.handleThreadCreate);

/***********************************
 *  Book Club Bot Event Handlers
 ************************************/

bcBot.once("ready", bcBotHandlers.handleReady);
bcBot.on("messageCreate", bcBotHandlers.handleMessageCreate);
bcBot.on("threadCreate", bcBotHandlers.handleThreadCreate);

/***********************************
 *  Podcast Bot Event Handlers
 ************************************/

// WeMartians
wmBot.once("ready", (client) => {
  podcastBotHandlers.handleReady(client, "wm");
  wmFeedListener.fetchChannel();
});
wmBot.on("messageCreate", (message) =>
  podcastBotHandlers.handleMessageCreate(message, wmFeedListener, "!wm")
);
wmBot.on("threadCreate", podcastBotHandlers.handleThreadCreate);

// Off-Nominal
ofnBot.once("ready", (client) => {
  podcastBotHandlers.handleReady(client, "ofn");
  ofnFeedListener.fetchChannel();
});
ofnBot.on("messageCreate", (message) =>
  podcastBotHandlers.handleMessageCreate(message, ofnFeedListener, "!ofn")
);
ofnBot.on("threadCreate", podcastBotHandlers.handleThreadCreate);

// MECO
mecoBot.once("ready", (client) => {
  podcastBotHandlers.handleReady(client, "meco");
  mecoFeedListener.fetchChannel();
});
mecoBot.on("messageCreate", (message) =>
  podcastBotHandlers.handleMessageCreate(message, mecoFeedListener, "!meco")
);
mecoBot.on("threadCreate", podcastBotHandlers.handleThreadCreate);

// RPR
rprBot.once("ready", (client) => {
  podcastBotHandlers.handleReady(client, "rpr");
  rprFeedListener.fetchChannel();
});
rprBot.on("messageCreate", (message) =>
  podcastBotHandlers.handleMessageCreate(message, rprFeedListener, "!rpr")
);
rprBot.on("threadCreate", podcastBotHandlers.handleThreadCreate);

// Headlines
hlBot.once("ready", (client) => {
  podcastBotHandlers.handleReady(client, "hl");
  hlFeedListener.fetchChannel();
});
hlBot.on("messageCreate", (message) =>
  podcastBotHandlers.handleMessageCreate(message, hlFeedListener, "!hl")
);
hlBot.on("threadCreate", podcastBotHandlers.handleThreadCreate);
