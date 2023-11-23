import { ThreadChannel, channelMention } from "discord.js";
import { Providers } from "../../providers";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import fetchGuild from "../../helpers/fetchGuild";

export function addRoleToThread(thread: ThreadChannel, role: string) {
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
    member.roles.cache.some((r) => r.id === role)
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

export default function AddModsToThread({ helperBot, mcconfig }: Providers) {
  helperBot.on("threadCreate", (thread) =>
    addRoleToThread(thread, mcconfig.discord.roles.mods)
  );
}