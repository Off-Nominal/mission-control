import { Client, Partials } from "discord.js";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import fetchGuild from "../../helpers/fetchGuild";
import { LogStatus } from "../../logger/Logger";

const helperBot = new Client({
  partials: [Partials.Channel, Partials.GuildMember],
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
helperBot.once("clientReady", populateGuildMembers);
helperBot.once("clientReady", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Helper Bot ready");
  bootLogger.logItemSuccess("helperBot");
});

export default helperBot;
