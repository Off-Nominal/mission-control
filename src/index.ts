import mcconfig from "./mcconfig";

// Boot Logger
import bootLogger from "./logger";
import { LogStatus } from "./logger/Logger";

// Providers
import { providers } from "./providers";

// Discord boot
import { connectAllDiscordBots } from "./helpers/discord-client-connect";
import { initDiscordBootStatus } from "./helpers/discord-boot-status";

// Services
import SetDiscordClientPresence from "./services/set-discord-client-presence";
import JoinDiscordThread from "./services/join-discord-thread";
import SendHelp from "./services/send-help";
import PostNews from "./services/post-news";
import AddModsToThread from "./services/add-mods-to-thread";
import NDB2 from "./services/ndb2";
import DeployWeMartiansSite from "./services/deploy-wemartians-site";
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
  DeployWeMartiansSite,
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

function listenApi(): Promise<void> {
  return new Promise((resolve) => {
    providers.api.listen(mcconfig.api.port, () => {
      bootLogger.addLog(
        LogStatus.SUCCESS,
        "Express Server booted and listening.",
      );
      bootLogger.logItemSuccess("api");
      console.log(
        "[Boot] /health is live — returns 503 until all Discord bots connect",
      );
      resolve();
    });
  });
}

async function main(): Promise<void> {
  bootLogger.addLog(LogStatus.INFO, "Mission Control in Startup...");
  initDiscordBootStatus();

  await listenApi();

  await connectAllDiscordBots([
    {
      client: providers.ndb2Bot,
      token: mcconfig.discord.clients.ndb2.token,
      label: "ndb2",
    },
    {
      client: providers.helperBot,
      token: mcconfig.discord.clients.helper.token,
      label: "helper",
    },
    {
      client: providers.contentBot,
      token: mcconfig.discord.clients.content.token,
      label: "content",
    },
    {
      client: providers.eventsBot,
      token: mcconfig.discord.clients.events.token,
      label: "events",
    },
  ]);

  console.log("[Boot] Discord ready — starting services");
  services.forEach((service) => service(providers));

  bootLogger.checkBoot(providers.helperBot);
}

main().catch((err) => {
  console.error("[Boot] Fatal startup error:", err);
  process.exit(1);
});
