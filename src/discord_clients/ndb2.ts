import { Client } from "discord.js";
import mcconfig from "../mcconfig";

const ndb2Bot = new Client({
  intents: [mcconfig.discord.intents.simpleIntents],
});

ndb2Bot.login(mcconfig.discord.clients.ndb2.token);

export default ndb2Bot;
