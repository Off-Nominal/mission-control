import {
  Client,
  ForumChannel,
  Guild,
  GuildForumTag,
  GuildForumThreadCreateOptions,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MediaChannel,
  MessageCreateOptions,
  ThreadAutoArchiveDuration,
  ThreadChannel,
} from "discord.js";
import { EventWindow } from "../../actions/monitor-events";
import { ContentListener } from "../../providers/rss-providers/ContentListener";
import {
  getRllIdFromEvent,
  getRLLMetadataFromText,
} from "../../helpers/rll_utils";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";
import createEventAnnouncementEmbed from "../../actions/create-event-announcement-embed";

const PRE_EVENT_NOTICE_IN_MIN = 30;

export const doesWindowMatch = (eventWindow: EventWindow): boolean =>
  PRE_EVENT_NOTICE_IN_MIN > eventWindow.minTime &&
  PRE_EVENT_NOTICE_IN_MIN < eventWindow.maxTime;

export const fetchExistingPost = async (
  event: GuildScheduledEvent,
  channel: ForumChannel | MediaChannel
): Promise<ThreadChannel | undefined> => {
  const rllId = getRllIdFromEvent(event);

  if (!rllId) {
    return undefined;
  }

  for (const thread of channel.threads.cache.values()) {
    const firstMessage = await thread.fetchStarterMessage();
    const threadRllId = getRLLMetadataFromText(
      firstMessage?.content || "",
      "rllId"
    );

    if (
      thread.name === event.name &&
      thread.ownerId === event.client.user.id &&
      rllId.toString() === threadRllId
    ) {
      return thread;
    }
  }
};

export const updateForumPostForEvent = async (
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  thread: ThreadChannel,
  url: string
) => {
  const embed = createEventAnnouncementEmbed(event, "thread", {});

  const message: MessageCreateOptions = {
    content: `Looks like we're back! Here is the updated event information.`,
    embeds: [embed],
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
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  channel: ForumChannel | MediaChannel,
  type: ForumType
): Promise<ThreadChannel> => {
  const tag = getTag(channel, type);

  const embed = createEventAnnouncementEmbed(event, "thread");

  const options: GuildForumThreadCreateOptions = {
    message: {
      content: event.description ?? undefined,
      embeds: [embed],
    },
    name: `${event.name}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
  };

  if (tag) {
    options.appliedTags = [tag.id];
  }

  return channel.threads.create(options);
};

export const getLivechatForumChannel = async (
  client: Client,
  id: string
): Promise<ForumChannel | MediaChannel> => {
  const channel = await client.channels.cache.get(id);
  if (!channel || !channel.isThreadOnly()) {
    throw new Error(
      "Livechat Forum Channel could not be found or is not a thread-only channel. This should happen."
    );
  }
  return channel;
};
