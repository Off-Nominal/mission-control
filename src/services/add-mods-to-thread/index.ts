import { AnyThreadChannel, ThreadChannel, channelMention } from "discord.js";
import { Providers } from "../../providers";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import fetchGuild from "../../helpers/fetchGuild";
import helperBot from "../../providers/helper-bot";

export function addRoleToThread(thread: AnyThreadChannel, role: string) {
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

  if (mods.size === 0) {
    logger.addLog(LogStatus.INFO, "No mods found to add to thread.");
    logger.sendLog(helperBot);
    return;
  }

  const promises = [];

  mods.forEach((mod) => {
    promises.push(
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
        })
    );
  });

  Promise.allSettled(promises).then(() => {
    logger.sendLog(helperBot);
  });
}

export default function AddModsToThread({ helperBot, mcconfig }: Providers) {
  helperBot.on("threadCreate", (thread) => {
    if (thread.parent.id === mcconfig.discord.channels.livechat) {
      return;
    }

    addRoleToThread(thread, mcconfig.discord.roles.mods);
  });
}
