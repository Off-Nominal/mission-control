import { ChatInputCommandInteraction, Client, Partials } from "discord.js";
import mcconfig from "../../../mcconfig";
import handlers from "../../../clients/handlers";
import scheduleThreadDigest from "../../../utilities/scheduleThreadDigest";
import reportGenerator from "../../../services/reportGenerator";
import { addModsToThread, populateGuildMembers } from "./handlers";

export enum HelperBotEvents {
  SUMMARY_CREATE = "summaryReportCreate",
  SUMMARY_SEND = "summaryReportSend",
  THREAD_DIGEST_SEND = "threadDigestSend",
  STARSHIP_UPDATE = "starshipSiteUpdate",
  SEND_DELINQUENTS = "sendDelinquents",
}

const helperBot = new Client({
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
  ],
  intents: [
    mcconfig.discord.intents.simpleIntents,
    mcconfig.discord.intents.utilityIntents,
  ],
});

// Handlers

helperBot.once("ready", populateGuildMembers);
helperBot.on("error", console.error);

helperBot.on("threadCreate", addModsToThread);

// helperBot.once("ready", scheduleThreadDigest);
// helperBot.on("messageCreate", handlers.helper.handleMessageCreate);
// helperBot.on("guildMemberUpdate", handlers.helper.handleGuildMemberUpdate);
// helperBot.on("messageReactionAdd", handlers.helper.handleMessageReactionAdd);

// helperBot.on("interactionCreate", (interaction) => {
//   handlers.helper.handleInteractionCreate(interaction);
// });

// helperBot.on(
//   HelperBotEvents.SEND_DELINQUENTS,
//   handlers.helper.handleSendDelinquents
// );
// helperBot.on(
//   HelperBotEvents.SUMMARY_CREATE,
//   (interaction: ChatInputCommandInteraction) => {
//     reportGenerator.handleReportRequest(interaction);
//   }
// );
// helperBot.on(HelperBotEvents.SUMMARY_SEND, reportGenerator.handleSendRequest);
// helperBot.on(
//   HelperBotEvents.THREAD_DIGEST_SEND,
//   handlers.helper.handleThreadDigestSend
// );
// helperBot.on(
//   HelperBotEvents.STARSHIP_UPDATE,
//   handlers.helper.handleStarshipSiteUpdate
// );

export default helperBot;
