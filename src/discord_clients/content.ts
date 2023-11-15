import { Client } from "discord.js";
import mcconfig from "../mcconfig";

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

export default contentBot;
