import { ChannelType, GuildMember, PartialGuildMember } from "discord.js";
import { sub } from "date-fns";
import { LogInitiator, Logger, LogStatus } from "../../logger/Logger";
import { Providers } from "../../providers";
import { buildClubWelcomeEmbed } from "./buildWelcomeEmbed";
import { getClubRoleIds, memberHasClubRole } from "./clubRoles";

export async function welcomeClubMember(
  oldMember: GuildMember | PartialGuildMember,
  newMember: GuildMember,
  providers: Pick<Providers, "mcconfig" | "models">
): Promise<void> {
  const clubRoleIds = new Set(getClubRoleIds(providers.mcconfig));
  const inClub = memberHasClubRole(newMember.roles.cache.keys(), clubRoleIds);
  const wasInClub = memberHasClubRole(
    oldMember.roles.cache.keys(),
    clubRoleIds
  );

  if (!inClub || wasInClub || clubRoleIds.size === 0) {
    return;
  }

  const logger = new Logger(
    "Club Membership",
    LogInitiator.DISCORD,
    "guildMemberUpdate"
  );
  const discordUserId = newMember.user.id;
  const now = new Date();
  const staleBefore = sub(now, {
    days: providers.mcconfig.membership.clubCooldownDays,
  });

  let claimHeld = false;
  let previousVerifiedAt: Date | null = null;

  try {
    const claim = await providers.models.memberClubVerification.claimWelcome(
      discordUserId,
      now,
      staleBefore
    );
    claimHeld = claim.claimed;
    previousVerifiedAt = claim.previousVerifiedAt;

    if (!claimHeld) {
      logger.addLog(
        LogStatus.INFO,
        `${newMember.displayName} already has a club verification within ${providers.mcconfig.membership.clubCooldownDays} days. No welcome sent.`
      );
      await logger.sendLog(newMember.client);
      return;
    }

    const sent = await sendClubWelcome(
      newMember,
      providers.mcconfig.discord.channels.general
    );

    if (!sent) {
      await providers.models.memberClubVerification.releaseWelcomeClaim(
        discordUserId,
        now,
        previousVerifiedAt
      );
      claimHeld = false;
      logger.addLog(
        LogStatus.FAILURE,
        `Club welcome was not sent for ${newMember.displayName}. Verification claim released.`
      );
      await logger.sendLog(newMember.client);
      return;
    }

    claimHeld = false;
    logger.addLog(
      LogStatus.SUCCESS,
      `Club welcome sent for ${newMember.displayName}.`
    );
    await logger.sendLog(newMember.client);
  } catch (err) {
    console.error(err);
    if (claimHeld) {
      try {
        await providers.models.memberClubVerification.releaseWelcomeClaim(
          discordUserId,
          now,
          previousVerifiedAt
        );
      } catch (releaseErr) {
        console.error(releaseErr);
      }
    }
    logger.addLog(
      LogStatus.FAILURE,
      `Club welcome failed for ${newMember.displayName}.`
    );
    await logger.sendLog(newMember.client);
  }
}

async function sendClubWelcome(
  member: GuildMember,
  generalChannelId: string
): Promise<boolean> {
  try {
    const channel = await member.client.channels.fetch(generalChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return false;
    }

    await channel.send({
      content: `Attention <@${member.user.id}>!`,
      embeds: [buildClubWelcomeEmbed(member)],
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
