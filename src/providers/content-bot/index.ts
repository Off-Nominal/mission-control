import mcconfig from "../../mcconfig";
import { Client } from "discord.js";

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

contentBot.on("error", console.error);

export default contentBot;
