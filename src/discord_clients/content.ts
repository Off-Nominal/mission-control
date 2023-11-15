import { Client } from "discord.js";
import mcconfig from "../mcconfig";

export enum ContentBotEvents {
  RSS_LIST = "rssList",
}

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

contentBot.login(mcconfig.discord.clients.content.token);

export default contentBot;
