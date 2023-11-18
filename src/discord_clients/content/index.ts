import mcconfig from "../../mcconfig";
import { Client } from "discord.js";
import { handleError, joinThread, setPresence } from "../common_handlers";
import { listRSSFeeds, sendHelp } from "./handlers";
import { sanityClient } from "../../utilities/sanity";

// export enum ContentBotEvents {
//   RSS_LIST = "rssList",
// }

const contentBot = new Client({
  intents: mcconfig.discord.intents.simpleIntents,
});

// Handlers
contentBot.once("ready", (client) => setPresence(client, "/content help"));
contentBot.on("error", handleError);

contentBot.on("threadCreate", joinThread);
contentBot.on("interactionCreate", sendHelp);
contentBot.on("interactionCreate", (interaction) =>
  listRSSFeeds(interaction, sanityClient)
);

// contentBot.on(ContentBotEvents.RSS_LIST, handlers.content.handleRssList);

export default contentBot;
