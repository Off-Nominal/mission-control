require("dotenv").config();

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

// command imports
import mainCommands from "./main";
import contentCommands from "./content";
import eventsCommands from "./events";
import ndb2Commands from "./ndb2";

const UTILITY_APP_ID = process.env.UTILITY_BOT_APP_ID;
const CONTENT_APP_ID = process.env.CONTENT_BOT_APP_ID;
const EVENTS_APP_ID = process.env.EVENT_BOT_APP_ID;
const NDB2_APP_ID = process.env.NDB2_BOT_APP_ID;

const UTILITY_TOKEN = process.env.UTILITY_BOT_TOKEN_ID;
const CONTENT_TOKEN = process.env.CONTENT_BOT_TOKEN_ID;
const EVENTS_TOKEN = process.env.EVENT_BOT_TOKEN_ID;
const NDB2_TOKEN = process.env.NDB2_BOT_TOKEN_ID;

const GUILD_ID = process.env.GUILD_ID;

const register = (appId, token, commands) => {
  const rest = new REST({ version: "10" }).setToken(token);

  return rest.put(Routes.applicationGuildCommands(appId, GUILD_ID), {
    body: commands,
  });
};

Promise.all([
  register(UTILITY_APP_ID, UTILITY_TOKEN, mainCommands),
  register(CONTENT_APP_ID, CONTENT_TOKEN, contentCommands),
  register(EVENTS_APP_ID, EVENTS_TOKEN, eventsCommands),
  register(NDB2_APP_ID, NDB2_TOKEN, ndb2Commands),
])
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch(console.error);
