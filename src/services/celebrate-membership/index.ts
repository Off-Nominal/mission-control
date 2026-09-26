import schedule from "node-schedule";
import { Providers } from "../../providers";
import { verifyClubMembers } from "./verifyClubMembers";
import { welcomeClubMember } from "./welcomeClubMember";

const nightlySchedule = "0 5 * * *";
let verificationScheduleStarted = false;

export default function CelebrateMembership({
  helperBot,
  mcconfig,
  models,
}: Providers) {
  helperBot.on("guildMemberUpdate", (oldMember, newMember) => {
    welcomeClubMember(oldMember, newMember, { mcconfig, models }).catch(
      (err) => {
        console.error("Club welcome failed", err);
      }
    );
  });

  // Services are registered after the gateway is already ready, so clientReady
  // has already fired and will not run this boot scan.
  const startVerification = () => {
    if (verificationScheduleStarted || !helperBot.isReady()) {
      return;
    }
    verificationScheduleStarted = true;

    verifyClubMembers(helperBot, { mcconfig, models }, {
      logTitle: "Club Verification Boot",
      eventName: "Boot Club Verification",
    }).catch((err) => {
      console.error("Boot club verification failed", err);
    });

    schedule.scheduleJob(nightlySchedule, () => {
      verifyClubMembers(helperBot, { mcconfig, models }, {
        logTitle: "Club Verification Nightly Job",
        eventName: "Nightly Club Verification",
      }).catch((err) => {
        console.error("Nightly club verification failed", err);
      });
    });
  };

  if (helperBot.isReady()) {
    startVerification();
  } else {
    helperBot.once("clientReady", startVerification);
  }
}
