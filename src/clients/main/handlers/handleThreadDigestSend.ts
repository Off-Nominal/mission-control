import { sub } from "date-fns";
import {
  Collection,
  EmbedBuilder,
  NewsChannel,
  Snowflake,
  TextChannel,
  ThreadChannel,
  ChannelType,
} from "discord.js";
import { isFulfilled } from "../../../helpers/allSettledTypeGuard";
import { fillMessageCache } from "../../../helpers/fillMessageCache";
import fetchGuild from "../../actions/fetchGuild";

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

export default async function handleThreadDigestSend() {
  const guild = fetchGuild(this);

  let activePublicThreads: Collection<Snowflake, ThreadChannel>;

  try {
    const activeThreads = await guild.channels.fetchActiveThreads();
    activePublicThreads = activeThreads.threads.filter(
      (thread) => thread.type === ChannelType.PublicThread
    );
  } catch (err) {
    return console.error(err);
  }

  const settledPromises = await Promise.allSettled(
    activePublicThreads.map((thread) => fillMessageCache(thread, 72))
  );

  const fetchedActivePublicThreads = settledPromises
    .filter(isFulfilled)
    .map((p) => p.value);

  const threadData: ThreadData[] = fetchedActivePublicThreads.map((thread) => {
    return {
      thread,
      messageCount: thread.messages.cache.filter(
        (cache) =>
          cache.createdTimestamp > sub(new Date(), { hours: 72 }).getTime()
      ).size,
    };
  });

  const threadDigests: ThreadDigests = {};

  threadData.forEach((threadData) => {
    if (!threadDigests[threadData.thread.parentId]) {
      threadDigests[threadData.thread.parentId] = {
        channel: threadData.thread.parent,
        threads: [],
      };
    }

    threadDigests[threadData.thread.parentId].threads.push(threadData);
  });

  for (const digest in threadDigests) {
    const currentDigest = threadDigests[digest];
    const fields = currentDigest.threads.map((threadData) => {
      return {
        name: threadData.thread.name,
        value: `<#${threadData.thread.id}> has ${threadData.messageCount} messages in the last 3 days.`,
      };
    });

    const embed = new EmbedBuilder({
      title: "Active Discord Threads",
      description:
        "Sometimes, threads are hard to notice on Discord. Here is your daily summary of the active conversations you might be missing in this channel!",
      fields,
    });

    try {
      await currentDigest.channel.messages.fetch({ limit: 1 });
      const { lastMessage } = currentDigest.channel;
      if (
        lastMessage.author.id === this.user.id &&
        lastMessage.embeds.length > 0 &&
        lastMessage.embeds[0]?.data?.title === "Active Discord Threads"
      ) {
        await lastMessage.edit({ embeds: [embed] });
      } else {
        await currentDigest.channel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error(err);
    }
  }
}
