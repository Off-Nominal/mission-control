import { Client } from "discord.js";
import mcconfig from "../mcconfig";

const ndb2Bot = new Client({
  intents: [mcconfig.discord.intents.simpleIntents],
});

export default ndb2Bot;
