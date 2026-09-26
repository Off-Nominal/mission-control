import schedule from "node-schedule";
import { LogInitiator, Logger, LogStatus } from "../../logger/Logger";
import { Providers } from "../../providers";
import { handleClubMemberUpdate, refreshClubVerifications } from "./refreshClubVerifications";
import { getClubRoleIds, memberHasClubRole } from "./clubRoles";

const nightlySchedule = "0 5 * * *";

export default function CelebrateMembership(providers: Providers) {
  const { helperBot } = providers;
  const clubRoleIdSet = () => new Set(getClubRoleIds(providers.mcconfig));

  helperBot.on("guildMemberUpdate", async (oldMember, newMember) => {
    const clubRoles = clubRoleIdSet();
    const inClub = memberHasClubRole(newMember.roles.cache.keys(), clubRoles);
    const wasInClub = memberHasClubRole(oldMember.roles.cache.keys(), clubRoles);

    if (!inClub || wasInClub) {
      return;
    }

    await handleClubMemberUpdate(newMember, providers);
  });

  helperBot.on("clientReady", (client) => {
    refreshClubVerifications(client, providers, {
      sendWelcomes: false,
      logToDiscord: false,
      eventName: "Startup Club Verification Backfill",
      logTitle: "Club Verification Backfill",
    }).catch((err) => {
      console.error("Startup club verification backfill failed", err);
    });

    schedule.scheduleJob(nightlySchedule, async () => {
      try {
        await refreshClubVerifications(client, providers, {
          sendWelcomes: false,
          logToDiscord: true,
          eventName: "Nightly Club Verification",
          logTitle: "Club Verification Nightly Job",
        });
      } catch (err) {
        console.error("Nightly club verification failed", err);
        const logger = new Logger(
          "Club Verification Nightly Job",
          LogInitiator.SERVER,
          "Nightly Club Verification"
        );
        logger.addLog(
          LogStatus.FAILURE,
          "Nightly club verification threw an unexpected error."
        );
        await logger.sendLog(client);
      }
    });
  });
}
