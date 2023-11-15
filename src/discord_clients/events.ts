import { Client } from "discord.js";
import mcconfig from "../mcconfig";

const eventsBot = new Client({
  intents: [
    mcconfig.discord.intents.simpleIntents,
    mcconfig.discord.intents.eventIntents,
  ],
});

export default eventsBot;
