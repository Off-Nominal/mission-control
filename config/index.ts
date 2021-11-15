import { ClientOptions, Intents, PermissionResolvable } from "discord.js";

// Fuse.js search Options
const defaultSearchOptions = {
  distance: 350,
  threshold: 0.7,
  includeScore: true,
  keys: [
    { name: "title", weight: 2 },
    { name: "description", weight: 3 },
  ],
};

// bot intents
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

const simpleOptions: ClientOptions = {
  intents: simpleIntents,
};
const utilityOptions: ClientOptions = {
  partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER"],
  intents: utilityIntents,
};

const config = {
  // id constants from your guild
  discordIds: {
    moderatorRoleId: process.env.MODS_ROLE_ID as PermissionResolvable,
    guildId: process.env.GUILD_ID,
    bocaChannel: process.env.BOCACHICACHANNELID,
    contentChannel: process.env.CONTENTCHANNELID,
    liveChatChannel: process.env.LIVECHATCHANNELID,
  },

  // podcast rss feeds
  feeds: {
    wm: process.env.WMFEED,
    meco: process.env.MECOFEED,
    ofn: process.env.OFNFEED,
    rpr: process.env.RPRFEED,
    hl: process.env.HLFEED,
  },

  // discord bot login tokens
  tokens: {
    utility: process.env.UTILITY_BOT_TOKEN_ID,
    bc: process.env.BOOK_CLUB_BOT_TOKEN_ID,
    wm: process.env.WEMARTIANS_BOT_TOKEN_ID,
    meco: process.env.MECO_BOT_TOKEN_ID,
    ofn: process.env.OFFNOM_BOT_TOKEN_ID,
    rpr: process.env.RPR_BOT_TOKEN_ID,
    hl: process.env.HL_BOT_TOKEN_ID,
  },

  // Search options for Fuse.js
  searchOptions: {
    wm: defaultSearchOptions,
    meco: defaultSearchOptions,
    ofn: defaultSearchOptions,
    rpr: defaultSearchOptions,
    hl: defaultSearchOptions,
  },

  // deployment urls for websites
  deployUrls: {
    wm: process.env.WM_DEPLOY_URL,
  },

  // Discord client intents
  intents: {
    simpleOptions,
    utilityOptions,
  },

  // Starship site URL
  siteTracking: {
    starship: "https://www.spacex.com/vehicles/starship/",
  },
};

export default config;
