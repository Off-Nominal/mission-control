import mcconfig from "../../mcconfig";
import { Client, ThreadChannel, channelMention } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../services/logger/Logger";
import fetchGuild from "../../utilities/fetchGuild";

// Find Off-Nominal Discord Guild, fetch members to prevent partials
export function populateGuildMembers(client: Client) {
  const guild = fetchGuild(client);
  guild.members
    .fetch()
    .catch((err) =>
      console.error("Error fetching partials for Guild Members", err)
    );
}

export function addModsToThread(thread: ThreadChannel) {
  const logger = new Logger(
    "Mod Thread Membership",
    LogInitiator.DISCORD,
    `threadCreate Event - ${channelMention(thread.id)}`
  );

  const guild = fetchGuild(thread.client);
  logger.addLog(
    LogStatus.INFO,
    `Guild resolved: ${guild.name} (ID: ${guild.id})`
  );

  // Auto-adds moderators to all threads
  const mods = guild.members.cache.filter((member) =>
    member.roles.cache.some((role) => role.id === mcconfig.discord.roles.mods)
  );
  logger.addLog(LogStatus.INFO, `Found ${mods.size} mods to add to thread.`);

  mods.forEach((mod) => {
    thread.members
      .add(mod.id)
      .then(() =>
        logger.addLog(
          LogStatus.SUCCESS,
          `Successfully added ${mod.displayName} to thread.`
        )
      )
      .catch((err) => {
        console.error(err);
        logger.addLog(
          LogStatus.FAILURE,
          `Failed to add ${mod.displayName} to thread.`
        );
      });
  });
}
