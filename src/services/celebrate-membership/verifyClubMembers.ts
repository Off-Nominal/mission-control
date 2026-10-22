import { Client } from "discord.js";
import { LogInitiator, Logger, LogStatus } from "../../logger/Logger";
import { Providers } from "../../providers";
import fetchGuild from "../../helpers/fetchGuild";
import { getClubRoleIds, memberHasClubRole } from "./clubRoles";

type VerifyOptions = {
  logTitle: string;
  eventName: string;
};

let verificationInFlight: Promise<void> | null = null;

export function verifyClubMembers(
  client: Client,
  providers: Pick<Providers, "mcconfig" | "models">,
  options: VerifyOptions
): Promise<void> {
  if (verificationInFlight) {
    return logSkipped(client, options);
  }

  const run = runVerification(client, providers, options).finally(() => {
    verificationInFlight = null;
  });
  verificationInFlight = run;
  return run;
}

async function logSkipped(client: Client, options: VerifyOptions): Promise<void> {
  const logger = new Logger(
    options.logTitle,
    LogInitiator.SERVER,
    options.eventName
  );
  logger.addLog(
    LogStatus.WARNING,
    "Skipped because another club verification is already running."
  );
  await logger.sendLog(client);
}

async function runVerification(
  client: Client,
  providers: Pick<Providers, "mcconfig" | "models">,
  options: VerifyOptions
): Promise<void> {
  const logger = new Logger(
    options.logTitle,
    LogInitiator.SERVER,
    options.eventName
  );

  try {
    const guild = fetchGuild(client);
    if (!guild) {
      logger.addLog(LogStatus.FAILURE, "Guild not found.");
      return;
    }

    const clubRoleIds = getClubRoleIds(providers.mcconfig);
    if (clubRoleIds.length === 0) {
      logger.addLog(LogStatus.FAILURE, "No club role IDs configured.");
      return;
    }

    const clubRoleIdSet = new Set(clubRoleIds);
    const members = await guild.members.fetch();
    const discordUserIds: string[] = [];

    for (const [memberId, member] of members) {
      if (memberHasClubRole(member.roles.cache.keys(), clubRoleIdSet)) {
        discordUserIds.push(memberId);
      }
    }

    const verifiedAt = new Date();
    const submitted =
      await providers.models.memberClubVerification.upsertLastVerifiedAt(
        discordUserIds,
        verifiedAt
      );

    logger.addLog(
      LogStatus.INFO,
      `Fetched ${members.size} guild members. ${discordUserIds.length} currently hold a club role.`
    );
    logger.addLog(
      discordUserIds.length > 0 ? LogStatus.SUCCESS : LogStatus.WARNING,
      discordUserIds.length > 0
        ? `Club verification succeeded (${submitted} members recorded).`
        : "Club verification finished, but no members currently hold a club role."
    );
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.addLog(
      LogStatus.FAILURE,
      `Club verification failed: ${message}`.slice(0, 900)
    );
  } finally {
    await logger.sendLog(client);
  }
}
