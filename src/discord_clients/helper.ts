import { ChatInputCommandInteraction, Client, Partials } from "discord.js";
import mcconfig from "../mcconfig";
import handlers from "../clients/handlers";
import scheduleThreadDigest from "../utilities/scheduleThreadDigest";
import handleError from "../clients/actions/handleError";
import reportGenerator from "../services/reportGenerator";

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

// // Handlers
// helperBot.once("ready", handlers.helper.handleReady);
// helperBot.once("ready", scheduleThreadDigest);
// helperBot.on("messageCreate", handlers.helper.handleMessageCreate);
// helperBot.on("guildMemberUpdate", handlers.helper.handleGuildMemberUpdate);
// helperBot.on("messageReactionAdd", handlers.helper.handleMessageReactionAdd);
// helperBot.on("threadCreate", handlers.helper.handleThreadCreate);
// helperBot.on("interactionCreate", (interaction) => {
//   handlers.helper.handleInteractionCreate(interaction);
// });
// helperBot.on("error", handleError);
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
