import mcconfig from "../mcconfig";

import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

// command imports
import mainCommands from "./main";
import contentCommands from "./content";
import eventsCommands from "./events";
import ndb2Commands from "./ndb2";

const register = (appId, token, commands) => {
  const rest = new REST({ version: "10" }).setToken(token);

  return rest.put(
    Routes.applicationGuildCommands(appId, mcconfig.discord.guildId),
    {
      body: commands,
    }
  );
};

Promise.all([
  register(
    mcconfig.discord.clients.helper.appId,
    mcconfig.discord.clients.helper.token,
    mainCommands
  ),
  register(
    mcconfig.discord.clients.content.appId,
    mcconfig.discord.clients.content.token,
    contentCommands
  ),
  register(
    mcconfig.discord.clients.events.appId,
    mcconfig.discord.clients.events.token,
    eventsCommands
  ),
  register(
    mcconfig.discord.clients.ndb2.appId,
    mcconfig.discord.clients.ndb2.token,
    ndb2Commands
  ),
])
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch(console.error);
