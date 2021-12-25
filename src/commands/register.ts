require("dotenv").config();

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

// command imports
import bookclubCommands from "./bookclub";
import hlCommands from "./hl";
import rprCommands from "./rpr";
import mecoCommands from "./meco";
import wmCommands from "./wm";
import ofnCommands from "./ofn";
import mainCommands from "./main";

const UTILITY_APP_ID = process.env.UTILITY_BOT_APP_ID;
const BC_APP_ID = process.env.BOOK_CLUB_BOT_APP_ID;
const WM_APP_ID = process.env.WEMARTIANS_BOT_APP_ID;
const MECO_APP_ID = process.env.MECO_BOT_APP_ID;
const OFN_APP_ID = process.env.OFFNOM_BOT_APP_ID;
const RPR_APP_ID = process.env.RPR_BOT_APP_ID;
const HL_APP_ID = process.env.HL_BOT_APP_ID;

const UTILITY_TOKEN = process.env.UTILITY_BOT_TOKEN_ID;
const BC_TOKEN = process.env.BOOK_CLUB_BOT_TOKEN_ID;
const WM_TOKEN = process.env.WEMARTIANS_BOT_TOKEN_ID;
const MECO_TOKEN = process.env.MECO_BOT_TOKEN_ID;
const OFN_TOKEN = process.env.OFFNOM_BOT_TOKEN_ID;
const RPR_TOKEN = process.env.RPR_BOT_TOKEN_ID;
const HL_TOKEN = process.env.HL_BOT_TOKEN_ID;

const GUILD_ID = process.env.GUILD_ID;

const register = (appId, token, commands) => {
  const rest = new REST({ version: "9" }).setToken(token);

  return rest.put(Routes.applicationGuildCommands(appId, GUILD_ID), {
    body: commands,
  });
};

Promise.all([
  register(UTILITY_APP_ID, UTILITY_TOKEN, mainCommands),
  register(BC_APP_ID, BC_TOKEN, bookclubCommands),
  register(WM_APP_ID, WM_TOKEN, wmCommands),
  register(MECO_APP_ID, MECO_TOKEN, mecoCommands),
  register(OFN_APP_ID, OFN_TOKEN, ofnCommands),
  register(RPR_APP_ID, RPR_TOKEN, rprCommands),
  register(HL_APP_ID, HL_TOKEN, hlCommands),
])
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch(console.error);
