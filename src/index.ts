import mcconfig from "./mcconfig";

// Boot Logger
import bootLogger from "./logger";
import { LogStatus } from "./logger/Logger";
bootLogger.addLog(LogStatus.INFO, "Mission Control in Startup...");

// Providers
import { providers } from "./providers";

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
import StarshipSiteListener from "./services/starship-site-listener";
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
import Notifications from "./services/notifications";

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
  StarshipSiteListener,
  StreamHost,
  ThreadDigest,
  TranslateTemperature,
  WarnDeprecatedCommands,
  CreateEventForumPost,
  CreateEventFromThread,
  Notifications,
];

services.forEach((service) => service(providers));

/***********************************
 *  API Initialization
 ************************************/

providers.api.listen(mcconfig.api.port, () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Express Server booted and listening.");
  bootLogger.logItemSuccess("api");
});

/***********************************
 *  Boot Logger
 ************************************/

bootLogger.checkBoot(providers.helperBot);
