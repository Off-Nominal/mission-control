import { Client } from "discord.js";
import mcconfig from "../../mcconfig";
import joinThread from "../../clients/actions/joinThread";
import { handleError, setPresence } from "../common_handlers";

export enum ContentBotEvents {
  RSS_LIST = "rssList",
}

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

// Handlers
contentBot.once("ready", (client) => setPresence(client, "/content help"));
contentBot.on("threadCreate", joinThread);
contentBot.on("error", handleError);

// contentBot.on("interactionCreate", (interaction) => {
//   handlers.content.handleInteractionCreate(interaction, feedListeners);
// });
// contentBot.on(ContentBotEvents.RSS_LIST, handlers.content.handleRssList);

export default contentBot;
