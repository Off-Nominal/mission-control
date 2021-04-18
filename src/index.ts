require("dotenv").config();
const Discord = require("discord.js");

import { Client, Message, PresenceData } from "discord.js";
import {
  bookClubMessageHandler,
  feedListenerMessageHandler,
  utilityMessageHandler,
} from "./handlers/message/";
import { utilityReactHandler } from "./handlers/messageReactionAdd";
import { FeedListener } from "./listeners/feedListener/feedListener";
import { feedMapper } from "./listeners/feedListener/feedMapper";
import { SiteListener } from "./listeners/siteListener";
import { logReady } from "./actions/global/logReady";
import { utilityGuildMemberAddHandler } from "./handlers/guildMemberAdd";
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

/***********************************
 *  Bot Setup
 ************************************/

const utilityBot: Client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER"],
});
const bcBot: Client = new Discord.Client();
const wmBot: Client = new Discord.Client();
const ofnBot: Client = new Discord.Client();
const mecoBot: Client = new Discord.Client();
const rprBot: Client = new Discord.Client();
const hlBot: Client = new Discord.Client();

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

const getPresenceData = (helpCommand: string): PresenceData => {
  return {
    status: "online",
    activity: {
      name: helpCommand,
      type: "PLAYING",
    },
  };
};

utilityBot.once("ready", () => {
  logReady(utilityBot.user.tag);
  utilityBot.user.setPresence(getPresenceData("!help"));
});
bcBot.once("ready", () => {
  logReady(bcBot.user.tag);
  bcBot.user.setPresence(getPresenceData("!bc help"));
});
wmBot.once("ready", () => {
  logReady(wmBot.user.tag);
  wmFeedListener.fetchChannel();
  wmBot.user.setPresence(getPresenceData("!wm help"));
});
ofnBot.once("ready", () => {
  logReady(ofnBot.user.tag);
  ofnFeedListener.fetchChannel();
  ofnBot.user.setPresence(getPresenceData("!ofn help"));
});
mecoBot.once("ready", () => {
  logReady(mecoBot.user.tag);
  mecoFeedListener.fetchChannel();
  mecoBot.user.setPresence(getPresenceData("!meco help"));
});
rprBot.once("ready", () => {
  logReady(rprBot.user.tag);
  rprFeedListener.fetchChannel();
  rprBot.user.setPresence(getPresenceData("!rpr help"));
});
hlBot.once("ready", () => {
  logReady(hlBot.user.tag);
  hlFeedListener.fetchChannel();
  hlBot.user.setPresence(getPresenceData("!hl help"));
});

starshipChecker.initialize();

/***********************************
 *  Utility Bot Actions
 ************************************/

utilityBot.on("message", (message) => {
  utilityMessageHandler(message, reportGenerator);
});
utilityBot.on("guildMemberAdd", utilityGuildMemberAddHandler);
utilityBot.on("messageReactionAdd", (messageReact, user) =>
  utilityReactHandler(messageReact, user, reportGenerator)
);

/***********************************
 *  Book Club Bot Actions
 ************************************/

bcBot.on("message", bookClubMessageHandler);

/***********************************
 *  Podcast Bot Actions
 ************************************/

wmBot.on("message", (message: Message) =>
  feedListenerMessageHandler(message, wmFeedListener, "!wm")
);
ofnBot.on("message", (message: Message) =>
  feedListenerMessageHandler(message, ofnFeedListener, "!ofn")
);
mecoBot.on("message", (message: Message) =>
  feedListenerMessageHandler(message, mecoFeedListener, "!meco")
);
rprBot.on("message", (message: Message) =>
  feedListenerMessageHandler(message, rprFeedListener, "!rpr")
);
hlBot.on("message", (message: Message) =>
  feedListenerMessageHandler(message, hlFeedListener, "!hl")
);
