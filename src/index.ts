require("dotenv").config();
const Discord = require("discord.js");

import { Client, Message } from "discord.js";
import onbListeners from "./onbListeners/";
import utilityListeners from "./utilityListeners/";
import bcbListeners from "./bcbListeners";
import { createSiteChecker } from "./utilityListeners/siteChecker";
import { FeedListener } from "./feeds/feedListener";
import { feedMapper } from "./feeds/feedMapper";

const TEST_CHANNEL = process.env.TESTCHANNEL;

const BOCACHICACHANNELID = process.env.BOCACHICACHANNELID || TEST_CHANNEL;
const CONTENTCHANNELID = process.env.CONTENTCHANNELID || TEST_CHANNEL;

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

/***********************************
 *  Bot Initializations
 ************************************/

const utilityBot: Client = new Discord.Client();
const bcBot: Client = new Discord.Client();
const wmBot: Client = new Discord.Client();
const ofnBot: Client = new Discord.Client();
const mecoBot: Client = new Discord.Client();
const rprBot: Client = new Discord.Client();
const hlBot: Client = new Discord.Client();

utilityBot.login(UTILITY_TOKEN);
bcBot.login(BC_TOKEN);
wmBot.login(WM_TOKEN);
ofnBot.login(OFN_TOKEN);
mecoBot.login(MECO_TOKEN);
rprBot.login(RPR_TOKEN);
hlBot.login(HL_TOKEN);

utilityBot.once("ready", () => utilityListeners.logReady(utilityBot.user.tag));
bcBot.once("ready", () => utilityListeners.logReady(bcBot.user.tag));
wmBot.once("ready", () => utilityListeners.logReady(wmBot.user.tag));
ofnBot.once("ready", () => utilityListeners.logReady(ofnBot.user.tag));
mecoBot.once("ready", () => utilityListeners.logReady(mecoBot.user.tag));
rprBot.once("ready", () => utilityListeners.logReady(rprBot.user.tag));
hlBot.once("ready", () => utilityListeners.logReady(hlBot.user.tag));

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
 *  Site Listeners
 ************************************/

const starshipChecker = createSiteChecker(
  utilityBot,
  "https://www.spacex.com/vehicles/starship/",
  BOCACHICACHANNELID
);

setInterval(() => {
  starshipChecker();
}, 60000);

/***********************************
 *  Feed Listeners
 ************************************/

const wmFeedListener = new FeedListener(
  WMFEED,
  feedMapper,
  wmBot,
  CONTENTCHANNELID,
  600000
);
const mecoFeedListener = new FeedListener(
  MECOFEED,
  feedMapper,
  mecoBot,
  CONTENTCHANNELID
);
const ofnFeedListener = new FeedListener(
  OFNFEED,
  feedMapper,
  ofnBot,
  CONTENTCHANNELID
);
const rprFeedListener = new FeedListener(
  RPRFEED,
  feedMapper,
  rprBot,
  CONTENTCHANNELID
);
const hlFeedListener = new FeedListener(
  HLFEED,
  feedMapper,
  hlBot,
  CONTENTCHANNELID
);

wmFeedListener.initialize();
mecoFeedListener.initialize();
ofnFeedListener.initialize();
rprFeedListener.initialize();
hlFeedListener.initialize();
