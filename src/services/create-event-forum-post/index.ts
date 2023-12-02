import {
  GuildForumThreadCreateOptions,
  GuildScheduledEvent,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { Providers } from "../../providers";
import { monitorEvents } from "../../actions/monitor-events";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import { parseCommands } from "../../helpers/parseCommands";
import fetchGuild from "../../helpers/fetchGuild";

const PRE_EVENT_NOTICE_IN_MIN = 30;

const postIsNeeded = (eventWindow) => {
  return (
    PRE_EVENT_NOTICE_IN_MIN > eventWindow.minTime &&
    PRE_EVENT_NOTICE_IN_MIN < eventWindow.maxTime
  );
};

const createForumPost = async (
  event: GuildScheduledEvent,
  channelId: string
) => {
  const logger = new Logger(
    "CreateEventForumPost",
    LogInitiator.DISCORD,
    `Creating Forum thread for Event ${event.id} - ${event.name}`
  );

  const channel = event.client.channels.cache.get(channelId);

  if (!channel.isThreadOnly()) {
    logger.addLog(LogStatus.FAILURE, "Channel is not a forum");
    logger.sendLog(event.client);
    return;
  }

  const tag = channel.availableTags.find((tag) => tag.name === "Launch");

  const options: GuildForumThreadCreateOptions = {
    message: {
      content: event.url,
    },
    name: `${event.name}`,
    appliedTags: [tag.id],
    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
  };

  try {
    await channel.threads.create(options);
    logger.addLog(LogStatus.SUCCESS, "Forum thread created");
  } catch (err) {
    console.error(err);
    logger.addLog(LogStatus.FAILURE, `Error creating forum thread: ${err}`);
  }

  logger.sendLog(event.client);
};

export default function CreateEventForumPost({
  eventsBot,
  helperBot,
  mcconfig,
}: Providers) {
  monitorEvents(eventsBot, (eventWindow) => {
    const makePost = postIsNeeded(eventWindow);
    if (makePost) {
      createForumPost(eventWindow.event, mcconfig.discord.channels.livechat);
    }
  });

  // dev helper to trigger new forum post
  helperBot.on("messageCreate", async (message) => {
    if (mcconfig.env !== "dev") {
      return;
    }

    const [prefix] = parseCommands(message);

    if (prefix !== "!eventforum") {
      return;
    }

    // fill cache
    const guild = fetchGuild(eventsBot);
    try {
      const events = await guild.scheduledEvents?.fetch();

      if (!events.at(0)) {
        return;
      }
      createForumPost(events.at(0), mcconfig.discord.channels.livechat);
    } catch (err) {
      console.log(err);
    }
  });
}
