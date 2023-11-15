import { GatewayIntentBits } from "discord.js";

require("dotenv").config();

const mcconfig = {
  discord: {
    intents: {
      simpleIntents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
      ],
      utilityIntents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
      eventIntents: [GatewayIntentBits.GuildScheduledEvents],
    },
    clients: {
      helperToken: process.env.DISCORD_CLIENT_TOKEN_ID_HELPER_BOT,
      contentToken: process.env.DISCORD_CLIENT_TOKEN_ID_CONTENT_BOT,
      eventToken: process.env.DISCORD_CLIENT_TOKEN_ID_EVENT_BOT,
      ndb2Token: process.env.DISCORD_CLIENT_TOKEN_ID_NDB2_BOT,
    },
  },
  providers: {
    rll: {
      key: process.env.PROV_RLL_KEY,
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
};

export default mcconfig;
