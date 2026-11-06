// Boot Logger
import bootLogger from "./logger";
import { LogStatus } from "./logger/Logger";

// Providers
import { providers } from "./providers";

// Discord boot
import { initDiscordBootStatus, setFoundationBootStatus } from "./helpers/discord-boot-status";
import { BootPhaseError, runBootSequence } from "./boot/run-boot-sequence";
import { discordPhase, foundationPhase } from "./boot/phases";

// Services
import SetDiscordClientPresence from "./services/set-discord-client-presence";
import JoinDiscordThread from "./services/join-discord-thread";
import SendHelp from "./services/send-help";
import PostNews from "./services/post-news";
import AddModsToThread from "./services/add-mods-to-thread";
import NDB2 from "./services/ndb2";
import ThreadDigest from "./services/thread-digest";
import ContentSearch from "./services/content-search";
import ContentPost from "./services/content-post";
import AnnounceStream from "./services/announce-stream";
import TranslateTemperature from "./services/translate-temperature";
import WarnDeprecatedCommands from "./services/warn-deprecated-commands";
import DBTest from "./services/db-test";
import Shunt from "./services/shunt";
import Poll from "./services/poll";
import MarsTime from "./services/mars-time";
import ChannelSummary from "./services/channel-summary";
import CelebrateMembership from "./services/celebrate-membership";
import LaunchEvents from "./services/launch-events";
import EventNotifications from "./services/event-notifications";
import StreamHost from "./services/stream-host";
import CreateEventForumPost from "./services/create-event-forum-post";
import CreateEventFromThread from "./services/create-event-from-thread";

const services = [
  AddModsToThread,
  AnnounceStream,
  ChannelSummary,
  CelebrateMembership,
  ContentPost,
  ContentSearch,
  DBTest,
  EventNotifications,
  JoinDiscordThread,
  LaunchEvents,
  MarsTime,
  NDB2,
  Poll,
  PostNews,
  SendHelp,
  SetDiscordClientPresence,
  Shunt,
  StreamHost,
  ThreadDigest,
  TranslateTemperature,
  WarnDeprecatedCommands,
  CreateEventForumPost,
  CreateEventFromThread,
];

async function main(): Promise<void> {
  bootLogger.addLog(LogStatus.INFO, "Mission Control in Startup...");
  initDiscordBootStatus();
  setFoundationBootStatus("running");

  try {
    await runBootSequence(
      [foundationPhase(), discordPhase()],
      (phase) => {
        if (phase.name === "foundation") {
          setFoundationBootStatus("ready");
          console.log(
            "[Boot] Foundation complete — connecting Discord gateways",
          );
        }
      },
    );
  } catch (error) {
    if (error instanceof BootPhaseError && error.phase === "foundation") {
      setFoundationBootStatus(
        "failed",
        error.failures.map((failure) => failure.name),
      );
      console.error(
        "[Boot] Foundation failed. Discord gateways will not connect.",
      );
      console.error(error.message);
      return;
    }
    throw error;
  }

  console.log("[Boot] Discord ready — starting services");
  services.forEach((service) => service(providers));

  bootLogger.checkBoot(providers.helperBot);
}

main().catch((err) => {
  if (err instanceof Error && err.name === "DiscordBootFatalError") {
    console.error("[Boot] Discord gateway login exhausted retries — exiting");
  }
  console.error("[Boot] Fatal startup error:", err);
  process.exit(1);
});
