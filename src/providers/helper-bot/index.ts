import { Client, Partials } from "discord.js";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import fetchGuild from "../../helpers/fetchGuild";
import { LogStatus } from "../../logger/Logger";

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
  intents: [mcconfig.discord.clients.helper.intents],
});

// Find Off-Nominal Discord Guild, fetch members to prevent partials
export function populateGuildMembers(client: Client) {
  const guild = fetchGuild(client);
  guild.members
    .fetch()
    .catch((err) =>
      console.error("Error fetching partials for Guild Members", err)
    );
}

helperBot.on("error", console.error);
helperBot.once("ready", populateGuildMembers);
helperBot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Helper Bot ready");
  bootLogger.logItemSuccess("helperBot");
});

helperBot.login(mcconfig.discord.clients.helper.token);

export default helperBot;
