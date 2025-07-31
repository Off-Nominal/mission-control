import { GatewayIntentBits } from "discord.js";

const mcconfig = {
  env: process.env.NODE_ENV || "dev",
  database: {
    url: process.env.DATABASE_URL,
  },
  api: {
    port: process.env.PORT || 8080,
  },
  discord: {
    guildId: process.env.DISCORD_GUILD_ID,
    channels: {
      splashdown: process.env.DISCORD_CHANNEL_ID_SPLASHDOWN || "",
      livechat: process.env.DISCORD_CHANNEL_ID_LIVECHAT || "",
      boca_chica: process.env.DISCORD_CHANNEL_ID_BOCACHICA || "",
      content: process.env.DISCORD_CHANNEL_ID_CONTENT || "",
      announcements: process.env.DISCORD_CHANNEL_ID_ANNOUNCEMENTS || "",
      general: process.env.DISCORD_CHANNEL_ID_GENERAL || "",
      mods: process.env.DISCORD_CHANNEL_ID_MODS || "",
      news: process.env.DISCORD_CHANNEL_ID_NEWS || "",
      bots: process.env.DISCORD_CHANNEL_ID_BOTS || "",
    },
    roles: {
      mods: process.env.DISCORD_ROLE_ID_MODS,
      bots: process.env.DISCORD_ROLE_ID_BOT,
      hosts: process.env.DISCORD_ROLE_ID_HOST,
      guests: process.env.DISCORD_ROLE_ID_GUEST,
      wemartians: process.env.DISCORD_ROLE_ID_WM,
      meco: process.env.DISCORD_ROLE_ID_MECO,
      youtube: process.env.DISCORD_ROLE_ID_YOUTUBE,
      youtube_anomaly: process.env.DISCORD_ROLE_ID_YT_ANOMALY,
      premium: process.env.DISCORD_ROLE_ID_PREMIUM,
      anomaly: process.env.DISCORD_ROLE_ID_ANOMALY,
      nfrs: process.env.DISCORD_ROLE_ID_NFRS,
    },
    clients: {
      helper: {
        token: process.env.DISCORD_CLIENT_TOKEN_ID_HELPER_BOT,
        appId: process.env.DISCORD_CLIENT_APP_ID_HELPER_BOT,
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions,
          GatewayIntentBits.MessageContent,
        ],
      },
      content: {
        token: process.env.DISCORD_CLIENT_TOKEN_ID_CONTENT_BOT,
        appId: process.env.DISCORD_CLIENT_APP_ID_CONTENT_BOT,
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
        ],
      },
      events: {
        token: process.env.DISCORD_CLIENT_TOKEN_ID_EVENT_BOT,
        appId: process.env.DISCORD_CLIENT_APP_ID_EVENT_BOT,
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildScheduledEvents,
        ],
      },
      ndb2: {
        token: process.env.DISCORD_CLIENT_TOKEN_ID_NDB2_BOT,
        appId: process.env.DISCORD_CLIENT_APP_ID_NDB2_BOT,
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
        ],
      },
    },
  },
  providers: {
    rll: {
      key: process.env.PROV_RLL_KEY,
    },
    youtube: {
      key: process.env.PROV_YT_KEY,
    },
    rapidApi: {
      key: process.env.PROV_RAPID_API_KEY,
    },
    sanity: {
      cmsId: process.env.PROV_SANITY_CMS_ID,
      dataset: process.env.PROV_SANITY_CMS_DATASET,
      cdn: false,
    },
  },
  content: {
    rss: {
      wm: process.env.RSS_WM,
      meco: process.env.RSS_MECO,
      ofn: process.env.RSS_OFN,
      ofn_yt: process.env.RSS_OFN_YT,
      ofn_hh: process.env.RSS_OFN_HH,
      rpr: process.env.RSS_RPR,
      hl: process.env.RSS_HL,
      searchOptions: {
        default: {
          distance: 350,
          threshold: 0.7,
          includeScore: true,
          keys: [
            { name: "title", weight: 2 },
            { name: "description", weight: 3 },
          ],
        },
        youtube: {
          distance: 350,
          threshold: 0.7,
          includeScore: true,
          keys: [
            { name: "title", weight: 2 },
            { name: "summary", weight: 3 },
          ],
        },
      },
    },
  },
  ndb2: {
    changeWindow: 12,
    clientId: process.env.NDB2_CLIENT_ID,
    baseUrl: process.env.NDB2_API_BASEURL,
  },
  wemartians: {
    deployUrl: process.env.WM_DEPLOY_URL,
  },
};

export default mcconfig;
