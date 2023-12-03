import {
  ForumChannel,
  GuildForumTag,
  GuildForumThreadCreateOptions,
  GuildScheduledEvent,
  MediaChannel,
  MessageCreateOptions,
  ThreadAutoArchiveDuration,
  ThreadChannel,
} from "discord.js";
import { EventWindow } from "../../actions/monitor-events";
import { ContentListener } from "../../providers/rss-providers/ContentListener";
import {
  getRllIdFromEvent,
  getRllIdFromText,
} from "../../helpers/getRllIdfromEvent";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";

const PRE_EVENT_NOTICE_IN_MIN = 30;

export const doesWindowMatch = (eventWindow: EventWindow): boolean =>
  PRE_EVENT_NOTICE_IN_MIN > eventWindow.minTime &&
  PRE_EVENT_NOTICE_IN_MIN < eventWindow.maxTime;

export const fetchExistingPost = async (
  event: GuildScheduledEvent,
  channel: ForumChannel | MediaChannel
): Promise<ThreadChannel | undefined> => {
  const rllId = getRllIdFromEvent(event);

  for (const thread of channel.threads.cache.values()) {
    const firstMessage = await thread.fetchStarterMessage();
    const threadRllId = getRllIdFromText(firstMessage.content);

    if (
      thread.name === event.name &&
      thread.ownerId === event.client.user.id &&
      rllId === threadRllId
    ) {
      return thread;
    }
  }
};

export const updateForumPostForEvent = async (
  thread: ThreadChannel,
  url: string
) => {
  const message: MessageCreateOptions = {
    content: `Looks like we're back! Here is the updated event information.\n\n${url}`,
  };

  try {
    await thread.send(message);
  } catch (err) {
    const logger = new Logger(
      "Monitor Events for Forum Posts",
      LogInitiator.DISCORD,
      "Update existing Forum threads"
    );
    logger.addLog(LogStatus.FAILURE, `Error updating forum thread.`);
    console.error(err);
    logger.sendLog(thread.client);
  }
};

export const getTag = (
  channel: ForumChannel | MediaChannel,
  type: ForumType
): GuildForumTag | undefined => {
  if (typeof type === "number") {
    return channel.availableTags.find((tag) => tag.name === "Launch");
  }

  if (type === "stream") {
    return channel.availableTags.find((tag) => tag.name === "Off-Nominal");
  }

  return undefined;
};

export type ForumType = "stream" | "other" | number;

export const getType = (
  event: GuildScheduledEvent,
  rssProvider: ContentListener
): ForumType => {
  let type: ForumType = "other";

  const isStream = rssProvider.isStream(event);
  if (isStream) {
    type = "stream";
  }

  const rllId = getRllIdFromEvent(event);
  if (rllId) {
    type = rllId;
  }

  return type;
};

export const createForumPost = async (
  event: GuildScheduledEvent,
  channel: ForumChannel | MediaChannel,
  type: ForumType
) => {
  const logger = new Logger(
    "CreateEventForumPost",
    LogInitiator.DISCORD,
    `Creating Forum thread for Event ${event.id} - ${event.name}`
  );

  const tag = getTag(channel, type);

  const options: GuildForumThreadCreateOptions = {
    message: {
      // add rllId if it exists
      content:
        event.url + (typeof type === "number" ? `\n\nrllId=[${type}]` : ""),
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
