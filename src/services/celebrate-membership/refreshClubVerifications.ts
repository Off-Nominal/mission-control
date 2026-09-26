import { ChannelType, Client, GuildMember } from "discord.js";
import { LogInitiator, Logger, LogStatus } from "../../logger/Logger";
import { Providers } from "../../providers";
import fetchGuild from "../../helpers/fetchGuild";
import { collectClubMemberIds } from "./collectClubMemberIds";
import { getClubRoleIds, memberHasClubRole } from "./clubRoles";
import { shouldWelcomeClubMember } from "./evaluateClubWelcome";
import { buildClubWelcomeEmbed } from "./buildWelcomeEmbed";
type RefreshOptions = {
  sendWelcomes: boolean;
  logToDiscord: boolean;
  eventName: string;
  logTitle: string;
};

export async function refreshClubVerifications(
  client: Client,
  providers: Pick<Providers, "mcconfig" | "models">,
  options: RefreshOptions
) {
  const logger = new Logger(
    options.logTitle,
    LogInitiator.SERVER,
    options.eventName
  );
  let jobFailed = false;

  const guild = fetchGuild(client);
  if (!guild) {
    jobFailed = true;
    logger.addLog(LogStatus.FAILURE, "Guild not found.");
    if (options.logToDiscord) {
      await logger.sendLog(client);
    }
    return;
  }

  const clubRoleIds = getClubRoleIds(providers.mcconfig);
  const clubRoleIdSet = new Set(clubRoleIds);

  if (clubRoleIds.length === 0) {
    jobFailed = true;
    logger.addLog(LogStatus.FAILURE, "No club role IDs configured.");
    if (options.logToDiscord) {
      await logger.sendLog(client);
    }
    return;
  }

  let memberIds: Set<string>;

  try {
    memberIds = await collectClubMemberIds(guild, clubRoleIds);
    logger.addLog(
      LogStatus.INFO,
      `Found ${memberIds.size} members with club roles.`
    );
  } catch (err) {
    console.error(err);
    jobFailed = true;
    logger.addLog(
      LogStatus.FAILURE,
      "Failed to collect members with club roles."
    );
    if (options.logToDiscord) {
      await logger.sendLog(client);
    }
    return;
  }

  const now = new Date();
  const cooldownDays = providers.mcconfig.membership.clubCooldownDays;
  let upserted = 0;
  let welcomed = 0;
  let welcomeFailures = 0;

  for (const discordUserId of memberIds) {
    try {
      const lastVerifiedAt =
        await providers.models.memberClubVerification.getLastVerifiedAt(
          discordUserId
        );

      if (options.sendWelcomes) {
        const welcome = shouldWelcomeClubMember(
          lastVerifiedAt,
          now,
          cooldownDays
        );

        if (welcome) {
          const member = await guild.members.fetch(discordUserId);
          const sent = await sendClubWelcome(
            member,
            clubRoleIdSet,
            providers.mcconfig.discord.channels.general
          );
          if (sent) {
            welcomed++;
          } else {
            welcomeFailures++;
          }
        }
      }

      await providers.models.memberClubVerification.upsertLastVerifiedAt(
        discordUserId,
        now
      );
      upserted++;
    } catch (err) {
      console.error(`Club verification failed for ${discordUserId}`, err);
      jobFailed = true;
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to verify member ${discordUserId}.`
      );
    }
  }

  if (options.sendWelcomes) {
    logger.addLog(
      LogStatus.SUCCESS,
      `Welcomed ${welcomed} members (${welcomeFailures} welcome failures).`
    );
  }

  logger.addLog(
    jobFailed ? LogStatus.FAILURE : LogStatus.SUCCESS,
    jobFailed
      ? `Nightly club verification completed with errors (${upserted} members updated).`
      : `Nightly club verification succeeded (${upserted} members updated).`
  );

  if (options.logToDiscord) {
    await logger.sendLog(client);
  }
}

export async function handleClubMemberUpdate(
  member: GuildMember,
  providers: Pick<Providers, "mcconfig" | "models">
) {
  const clubRoleIds = getClubRoleIds(providers.mcconfig);
  const clubRoleIdSet = new Set(clubRoleIds);

  if (
    !memberHasClubRole(member.roles.cache.keys(), clubRoleIdSet) ||
    clubRoleIds.length === 0
  ) {
    return;
  }

  const logger = new Logger(
    "Club Membership",
    LogInitiator.DISCORD,
    "guildMemberUpdate"
  );

  const discordUserId = member.user.id;
  const now = new Date();
  const cooldownDays = providers.mcconfig.membership.clubCooldownDays;

  const lastVerifiedAt =
    await providers.models.memberClubVerification.getLastVerifiedAt(
      discordUserId
    );

  const welcome = shouldWelcomeClubMember(lastVerifiedAt, now, cooldownDays);

  logger.addLog(
    LogStatus.INFO,
    `${member.displayName}: welcome ${welcome ? "yes" : "no"} (last verified ${
      lastVerifiedAt ? lastVerifiedAt.toISOString() : "never"
    }).`
  );

  if (welcome) {
    const sent = await sendClubWelcome(
      member,
      clubRoleIdSet,
      providers.mcconfig.discord.channels.general
    );
    if (sent) {
      logger.addLog(LogStatus.SUCCESS, "Club welcome message sent.");
    } else {
      logger.addLog(LogStatus.FAILURE, "Club welcome message not sent.");
    }
  }

  await providers.models.memberClubVerification.upsertLastVerifiedAt(
    discordUserId,
    now
  );

  try {
    await logger.sendLog(member.client);
  } catch (err) {
    console.error(err);
  }
}

async function sendClubWelcome(
  member: GuildMember,
  clubRoleIdSet: ReadonlySet<string>,
  generalChannelId: string
): Promise<boolean> {
  if (!memberHasClubRole(member.roles.cache.keys(), clubRoleIdSet)) {
    return false;
  }

  try {
    const channel = await member.client.channels.fetch(generalChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return false;
    }

    const embed = buildClubWelcomeEmbed(member);
    await channel.send({
      content: `Attention <@${member.user.id}>!`,
      embeds: [embed],
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
