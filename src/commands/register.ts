require("dotenv").config();

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

// command imports
import bookclubCommands from "./bookclub";
import mainCommands from "./main";
import contentCommands from "./content";
import eventsCommands from "./events";

const UTILITY_APP_ID = process.env.UTILITY_BOT_APP_ID;
const BC_APP_ID = process.env.BOOK_CLUB_BOT_APP_ID;
const CONTENT_APP_ID = process.env.CONTENT_BOT_APP_ID;
const EVENTS_APP_ID = process.env.EVENT_BOT_APP_ID;

const UTILITY_TOKEN = process.env.UTILITY_BOT_TOKEN_ID;
const BC_TOKEN = process.env.BOOK_CLUB_BOT_TOKEN_ID;
const CONTENT_TOKEN = process.env.CONTENT_BOT_TOKEN_ID;
const EVENTS_TOKEN = process.env.EVENT_BOT_TOKEN_ID;

const GUILD_ID = process.env.GUILD_ID;

const register = (appId, token, commands) => {
  const rest = new REST({ version: "10" }).setToken(token);

  return rest.put(Routes.applicationGuildCommands(appId, GUILD_ID), {
    body: commands,
  });
};

Promise.all([
  register(UTILITY_APP_ID, UTILITY_TOKEN, mainCommands),
  register(BC_APP_ID, BC_TOKEN, bookclubCommands),
  register(CONTENT_APP_ID, CONTENT_TOKEN, contentCommands),
  register(EVENTS_APP_ID, EVENTS_TOKEN, eventsCommands),
])
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch(console.error);
