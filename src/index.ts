require("dotenv").config();

import {
  Client,
  Intents,
  PermissionResolvable,
  PresenceData,
} from "discord.js";
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

const MODS_ROLE_ID = process.env.MODS_ROLE_ID as PermissionResolvable;
const GUILD_ID = process.env.GUILD_ID;

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

const getPresenceData = (helpCommand: string): PresenceData => {
  return {
    status: "online",
    activities: [
      {
        name: helpCommand,
        type: "PLAYING",
      },
    ],
  };
};

utilityBot.once("ready", () => {
  logReady(utilityBot.user.tag);
  utilityBot.user.setPresence(getPresenceData("!help"));
  channelBabysitter.initialize();

  // Find Off-Nominal Discord Guild, fetch members to prevent partials
  const guild = utilityBot.guilds.cache.find((guild) => guild.id === GUILD_ID);
  guild.members
    .fetch()
    .catch((err) =>
      console.error("Error fetching partials for Guild Members", err)
    );
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

utilityBot.on("messageCreate", (message) =>
  utilityMessageHandler(message, reportGenerator)
);
utilityBot.on("guildMemberAdd", utilityGuildMemberAddHandler);
utilityBot.on("messageReactionAdd", (messageReact, user) => {
  utilityReactHandler(messageReact, user, {
    reportGenerator,
    channelBabysitter,
  });
});
utilityBot.on("threadCreate", async (thread) => {
  if (thread.joinable) {
    thread
      .join()
      .catch((err) => console.error("Error joining Utility Bot to thread"));

    const guild = utilityBot.guilds.cache.find(
      (guild) => guild.id === GUILD_ID
    );

    // Auto-adds moderators to all threads
    const mods = guild.members.cache.filter((member) =>
      member.roles.cache.some((role) => role.id === MODS_ROLE_ID)
    );

    console.log(`Found ${mods.size} mods.`);
    console.log("Adding mods to Thread");

    mods.forEach((mod) => {
      thread.members
        .add(mod.id)
        .then(() => console.log(`Added ${mod.displayName}`))
        .catch((err) => {
          console.error(`Failed to add ${mod.displayName} to Thread`);
          console.error(err);
        });
    });
  }
});

/***********************************
 *  Book Club Bot Actions
 ************************************/

bcBot.on("messageCreate", bookClubMessageHandler);
bcBot.on("threadCreate", async (thread) => {
  if (thread.joinable) await thread.join();
});

/***********************************
 *  Podcast Bot Actions
 ************************************/

// WeMartians
wmBot.on("messageCreate", (message) =>
  feedListenerMessageHandler(message, wmFeedListener, "!wm")
);
wmBot.on("threadCreate", async (thread) => {
  if (thread.joinable) await thread.join();
});

// Off-Nominal
ofnBot.on("messageCreate", (message) =>
  feedListenerMessageHandler(message, ofnFeedListener, "!ofn")
);
ofnBot.on("threadCreate", async (thread) => {
  if (thread.joinable) await thread.join();
});

// MECO
mecoBot.on("messageCreate", (message) =>
  feedListenerMessageHandler(message, mecoFeedListener, "!meco")
);
mecoBot.on("threadCreate", async (thread) => {
  if (thread.joinable) await thread.join();
});

// RPR
rprBot.on("messageCreate", (message) =>
  feedListenerMessageHandler(message, rprFeedListener, "!rpr")
);
rprBot.on("threadCreate", async (thread) => {
  if (thread.joinable) await thread.join();
});

// Headlines
hlBot.on("messageCreate", (message) =>
  feedListenerMessageHandler(message, hlFeedListener, "!hl")
);
hlBot.on("threadCreate", async (thread) => {
  if (thread.joinable) await thread.join();
});
