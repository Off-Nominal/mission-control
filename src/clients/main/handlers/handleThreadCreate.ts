import {
  channelMention,
  PermissionResolvable,
  ThreadChannel,
} from "discord.js";
import { LogInitiator } from "../../../types/logEnums";
import { Logger, LogStatus } from "../../../utilities/logger";
import fetchGuild from "../../actions/fetchGuild";
import joinThread from "../../actions/joinThread";

const MODS_ROLE_ID = process.env.MODS_ROLE_ID as PermissionResolvable;

export default async function handleThreadCreate(thread: ThreadChannel) {
  const logger = new Logger(
    "Mod Thread Membership",
    LogInitiator.DISCORD,
    `threadCreate Event - ${channelMention(thread.id)}`
  );

  try {
    await joinThread(thread);
    logger.addLog(LogStatus.SUCCESS, `Helper Bot successfully joined thread`);
  } catch (err) {
    console.error(err);
    logger.addLog(LogStatus.FAILURE, `Helper Bot did not join thread`);
  }

  const guild = fetchGuild(thread.client);
  logger.addLog(
    LogStatus.INFO,
    `Guild resolved: ${guild.name} (ID: ${guild.id})`
  );

  // Auto-adds moderators to all threads
  const mods = guild.members.cache.filter((member) =>
    member.roles.cache.some((role) => role.id === MODS_ROLE_ID)
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
