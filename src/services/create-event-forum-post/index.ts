import {
  ForumChannel,
  GuildForumTag,
  GuildForumThreadCreateOptions,
  GuildScheduledEvent,
  MediaChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { Providers } from "../../providers";
import { monitorEvents } from "../../actions/monitor-events";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import { parseCommands } from "../../helpers/parseCommands";
import fetchGuild from "../../helpers/fetchGuild";
import { ContentListener } from "../../providers/rss-providers/ContentListener";
import { getRllIdFromEvent } from "../../helpers/getRllIdfromEvent";

const PRE_EVENT_NOTICE_IN_MIN = 30;

const postIsNeeded = (eventWindow) => {
  return (
    PRE_EVENT_NOTICE_IN_MIN > eventWindow.minTime &&
    PRE_EVENT_NOTICE_IN_MIN < eventWindow.maxTime
  );
};

const getTag = (
  channel: ForumChannel | MediaChannel,
  type: "stream" | "launch" | "other"
): GuildForumTag | undefined => {
  if (type === "launch") {
    return channel.availableTags.find((tag) => tag.name === "Launch");
  }

  if (type === "stream") {
    return channel.availableTags.find((tag) => tag.name === "Off-Nominal");
  }

  return undefined;
};

const createForumPost = async (
  event: GuildScheduledEvent,
  channelId: string,
  type: "stream" | "launch" | "other"
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

  const tag = getTag(channel, type);

  const options: GuildForumThreadCreateOptions = {
    message: {
      content: event.url,
    },
    name: `${event.name}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
  };

  if (tag) {
    options.appliedTags = [tag.id];
  }

  try {
    await channel.threads.create(options);
    logger.addLog(LogStatus.SUCCESS, "Forum thread created");
  } catch (err) {
    console.error(err);
    logger.addLog(LogStatus.FAILURE, `Error creating forum thread: ${err}`);
  }

  logger.sendLog(event.client);
};

const getType = (
  event: GuildScheduledEvent,
  rssProvider: ContentListener
): "stream" | "launch" | "other" => {
  let type: "stream" | "launch" | "other" = "other";

  const isStream = rssProvider.isStream(event);
  if (isStream) {
    type = "stream";
  }

  const rllId = getRllIdFromEvent(event);
  if (rllId) {
    type = "launch";
  }

  return type;
};

export default function CreateEventForumPost({
  eventsBot,
  helperBot,
  mcconfig,
  rssProviders,
}: Providers) {
  monitorEvents(eventsBot, (eventWindow) => {
    const makePost = postIsNeeded(eventWindow);

    if (makePost) {
      const type = getType(eventWindow.event, rssProviders.yt);

      createForumPost(
        eventWindow.event,
        mcconfig.discord.channels.livechat,
        type
      );
    }
  });

  // dev helper to trigger new forum post
  helperBot.on("messageCreate", async (message) => {
    if (mcconfig.env !== "dev") {
      return;
    }

    const [prefix, eventId] = parseCommands(message);

    if (prefix !== "!eventforum") {
      return;
    }

    // fill cache
    const guild = fetchGuild(eventsBot);
    try {
      const event = await guild.scheduledEvents?.fetch(eventId);

      if (!event) {
        return;
      }
      const type = getType(event, rssProviders.yt);

      createForumPost(event, mcconfig.discord.channels.livechat, type);
    } catch (err) {
      console.log(err);
    }
  });
}
