import { sub } from "date-fns";
import {
  Collection,
  EmbedBuilder,
  NewsChannel,
  Snowflake,
  TextChannel,
  ThreadChannel,
  ChannelType,
  channelMention,
  Message,
  messageLink,
  hyperlink,
  Client,
  ForumChannel,
} from "discord.js";
import { isFulfilled, isRejected } from "../../../helpers/allSettledTypeGuard";
import { fillMessageCache } from "../../../helpers/fillMessageCache";
import { LogInitiator, Logger, LogStatus } from "../../../services/logger";
import fetchGuild from "../../../utilities/fetchGuild";

type ThreadData = {
  thread: ThreadChannel;
  messageCount: number;
};

type ThreadDigest = {
  channel: TextChannel | NewsChannel;
  threads: ThreadData[];
};

type ThreadDigests = {
  [key: string]: ThreadDigest;
};

export default async function handleThreadDigestSend(client: Client) {
  const logger = new Logger(
    "Thread Digest Log",
    LogInitiator.SERVER,
    "Scheduled Digest Send"
  );

  const guild = fetchGuild(this);
  logger.addLog(
    LogStatus.INFO,
    `Guild resolved: ${guild.name} (ID: ${guild.id})`
  );

  let activePublicThreads: Collection<Snowflake, ThreadChannel>;

  try {
    const activeThreads = await guild.channels.fetchActiveThreads();
    logger.addLog(
      LogStatus.SUCCESS,
      `${activeThreads.threads.size} active threads fetched from Discord.`
    );
    activePublicThreads = activeThreads.threads.filter(
      (thread) =>
        thread.type === ChannelType.PublicThread &&
        thread.parent.type === ChannelType.GuildText
    );
    logger.addLog(
      LogStatus.INFO,
      `${activePublicThreads.size} active threads after filtering non-public threads and forum threads.`
    );
  } catch (err) {
    logger.addLog(
      LogStatus.FAILURE,
      "Failed to fetch active threads from API."
    );
    return console.error(err);
  }

  logger.addLog(
    LogStatus.INFO,
    "Fetching messages in time window to fill caches for counting."
  );
  const settledPromises = await Promise.allSettled(
    activePublicThreads.map((thread) => fillMessageCache(thread, 72))
  );

  const fetchedActivePublicThreads = settledPromises
    .filter(isFulfilled)
    .map((p) => p.value);

  if (fetchedActivePublicThreads.length === activePublicThreads.size) {
    logger.addLog(LogStatus.SUCCESS, "All thread caches filled successfully.");
  } else {
    logger.addLog(
      LogStatus.FAILURE,
      `Only successfully filled ${fetchedActivePublicThreads.length}/${activePublicThreads.size} thread caches.`
    );
    const errors = settledPromises.filter(isRejected).map((p) => p.reason);
    for (const error of errors) {
      console.error(error);
    }
  }

  const threadData: ThreadData[] = fetchedActivePublicThreads.map((thread) => {
    const messageCount = thread.messages.cache.filter(
      (cache) =>
        cache.createdTimestamp > sub(new Date(), { hours: 72 }).getTime()
    ).size;

    logger.addLog(
      LogStatus.INFO,
      `Active Thread ${channelMention(
        thread.id
      )} prepped with ${messageCount} messages.`
    );

    return {
      thread,
      messageCount,
    };
  });

  const filteredThreadData = threadData.filter((data) => data.messageCount > 0);

  logger.addLog(
    LogStatus.INFO,
    `${filteredThreadData.length} actually active threads after filtering out ones with 0 messages.`
  );

  const threadDigests: ThreadDigests = {};

  filteredThreadData.forEach((threadData) => {
    if (
      threadData.thread.parent.type !== ChannelType.GuildForum &&
      !threadDigests[threadData.thread.parentId]
    ) {
      threadDigests[threadData.thread.parentId] = {
        channel: threadData.thread.parent,
        threads: [],
      };
    }

    threadDigests[threadData.thread.parentId].threads.push(threadData);
  });

  const totalDigests = Object.keys(threadDigests).length;
  let sentDigests = 0;

  for (const parentId in threadDigests) {
    const currentDigest = threadDigests[parentId];
    logger.addLog(
      LogStatus.INFO,
      `Prepping channel message for Channel ID ${channelMention(
        parentId
      )} with ${currentDigest.threads.length} active threads.`
    );

    const fields = currentDigest.threads.map((threadData) => {
      return {
        name: threadData.thread.name,
        value: `<#${threadData.thread.id}> has ${threadData.messageCount} messages.`,
      };
    });

    const embed = new EmbedBuilder({
      title: "Active Discord Threads",
      description:
        "Sometimes, threads are hard to notice on Discord. Here is your daily summary of the active conversations you might be missing in this channel!",
      fields,
    });

    let lastMessage: Message;

    try {
      const messages = await currentDigest.channel.messages.fetch({ limit: 1 });
      if (messages.size === 0) {
        throw `Message collection size is zero for ${channelMention(
          currentDigest.channel.id
        )}`;
      }
      lastMessage = messages.first();
      logger.addLog(
        LogStatus.SUCCESS,
        `Fetched ${hyperlink(
          "last message",
          messageLink(currentDigest.channel.id, lastMessage.id)
        )} from ${channelMention(currentDigest.channel.id)}`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Couldn't fetch last message from channel ${channelMention(
          currentDigest.channel.id
        )}`
      );
    }

    if (
      lastMessage?.author.id === this.user.id &&
      lastMessage.embeds.length > 0 &&
      lastMessage.embeds[0]?.data?.title === "Active Discord Threads"
    ) {
      try {
        await lastMessage.edit({ embeds: [embed] });
        logger.addLog(
          LogStatus.SUCCESS,
          `Edited last message in ${channelMention(currentDigest.channel.id)}.`
        );
        sentDigests++;
      } catch (err) {
        console.error(err);
        logger.addLog(
          LogStatus.FAILURE,
          `Error editing last message in ${channelMention(
            currentDigest.channel.id
          )}.`
        );
      }
    } else {
      try {
        await currentDigest.channel.send({ embeds: [embed] });
        logger.addLog(
          LogStatus.SUCCESS,
          `Sent digest to ${channelMention(currentDigest.channel.id)}`
        );
        sentDigests++;
      } catch (err) {
        logger.addLog(
          LogStatus.FAILURE,
          `Failed to send digest to ${channelMention(currentDigest.channel.id)}`
        );
      }
    }
  }

  const allSuccessful = sentDigests === totalDigests;
  logger.addLog(
    allSuccessful ? LogStatus.SUCCESS : LogStatus.INFO,
    `${sentDigests} of ${totalDigests} successfully sent.`
  );

  logger.sendLog(client);
}
