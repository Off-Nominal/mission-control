import {
  Collection,
  Message,
  EmbedBuilder,
  NewsChannel,
  Snowflake,
  TextChannel,
  ThreadChannel,
  ChannelType,
} from "discord.js";
import { fetchMessagesInLast } from "../../../helpers/fetchMessagesInLast";
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

  let activeThreads: Collection<Snowflake, ThreadChannel>;

  try {
    const fetchedThreads = await guild.channels.fetchActiveThreads();
    activeThreads = fetchedThreads.threads.filter(
      (thread) => thread.type === ChannelType.GuildPublicThread
    );
  } catch (err) {
    return console.error(err);
  }

  const promises = await Promise.allSettled(
    activeThreads.map((thread) => fetchMessagesInLast(thread, 72))
  );

  const fulfilledPromises = promises.filter((promise) => {
    if (promise.status === "rejected") {
      console.error(promise.reason);
    }
    return promise.status === "fulfilled" && promise.value.size > 0;
  }) as PromiseFulfilledResult<Collection<string, Message<boolean>>>[];

  const fetchedActiveThreads: ThreadData[] = fulfilledPromises.map(
    (fulfilledPromise, index) => {
      return {
        thread: activeThreads.at(index),
        messageCount: fulfilledPromise.value.size,
      };
    }
  );

  const threadDigests: ThreadDigests = {};

  fetchedActiveThreads.forEach((threadData) => {
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
