import mcconfig from "../../../mcconfig";
import { Client } from "discord.js";

// export enum ContentBotEvents {
//   RSS_LIST = "rssList",
// }

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

// Handlers
contentBot.on("error", console.error);

// contentBot.on(ContentBotEvents.RSS_LIST, handlers.content.handleRssList);

export default contentBot;
