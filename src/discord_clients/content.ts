import { Client } from "discord.js";
import mcconfig from "../mcconfig";

export enum ContentBotEvents {
  RSS_LIST = "rssList",
}

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

// contentBot.once("ready", handlers.content.handleReady);

// contentBot.on("threadCreate", handlers.content.handleThreadCreate);
// contentBot.on("interactionCreate", (interaction) => {
//   handlers.content.handleInteractionCreate(interaction, feedListeners);
// });
// contentBot.on("error", handleError);
// contentBot.on(ContentBotEvents.RSS_LIST, handlers.content.handleRssList);

export default contentBot;
