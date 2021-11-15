require("dotenv").config();

import { Client, Intents, PresenceData } from "discord.js";
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
import config from "../config/";

/***********************************
 *  Bot Setup
 ************************************/

const { simpleOptions, utilityOptions } = config.intents;

const utilityBot = new Client(utilityOptions);
const bcBot = new Client(simpleOptions);
const wmBot = new Client(simpleOptions);
const ofnBot = new Client(simpleOptions);
const mecoBot = new Client(simpleOptions);
const rprBot = new Client(simpleOptions);
const hlBot = new Client(simpleOptions);

/***********************************
 *  Site Listener Setup
 ************************************/

const starshipChecker = new SiteListener(
  config.siteTracking.starship,
  utilityBot,
  config.discordIds.bocaChannel,
  { interval: 15, cooldown: 600 }
);

/***********************************
 *  Feed Listener Setup
 ************************************/

const { feeds, searchOptions, deployUrls } = config;

const wmFeedListener = new FeedListener(feeds.wm, {
  processor: feedMapper,
  discordClient: wmBot,
  channelId: config.discordIds.contentChannel,
  actionDelay: 600,
  searchOptions: searchOptions.wm,
  deployUrl: deployUrls.wm,
});
const mecoFeedListener = new FeedListener(feeds.meco, {
  processor: feedMapper,
  discordClient: mecoBot,
  channelId: config.discordIds.contentChannel,
  searchOptions: searchOptions.meco,
});
const ofnFeedListener = new FeedListener(feeds.ofn, {
  processor: feedMapper,
  discordClient: ofnBot,
  actionDelay: 60,
  channelId: config.discordIds.contentChannel,
  searchOptions: searchOptions.ofn,
});
const rprFeedListener = new FeedListener(feeds.rpr, {
  processor: feedMapper,
  discordClient: rprBot,
  channelId: config.discordIds.contentChannel,
  actionDelay: 600,
  searchOptions: searchOptions.rpr,
});
const hlFeedListener = new FeedListener(feeds.hl, {
  processor: feedMapper,
  discordClient: hlBot,
  channelId: config.discordIds.contentChannel,
  searchOptions: searchOptions.hl,
});

/***********************************
 *  UTILITY SETUPS
 ************************************/

const reportGenerator = new ReportGenerator();
const channelBabysitter = new ChannelBabysitter(
  utilityBot,
  config.discordIds.liveChatChannel
);

/***********************************
 *  ASYNC LOGINS/INITS
 ************************************/

const { tokens } = config;

utilityBot.login(tokens.utility);
bcBot.login(tokens.bc);
wmBot.login(tokens.wm);
ofnBot.login(tokens.ofn);
mecoBot.login(tokens.meco);
rprBot.login(tokens.rpr);
hlBot.login(tokens.hl);

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
  const guild = utilityBot.guilds.cache.find(
    (guild) => guild.id === config.discordIds.guildId
  );
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
      (guild) => guild.id === config.discordIds.guildId
    );

    // Auto-adds moderators to all threads
    const mods = guild.members.cache.filter((member) =>
      member.roles.cache.some(
        (role) => role.id === config.discordIds.moderatorRoleId
      )
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
