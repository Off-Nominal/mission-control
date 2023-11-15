import { Client } from "discord.js";
import mcconfig from "../mcconfig";

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

contentBot.login(mcconfig.discord.clients.content.token);

export default contentBot;
