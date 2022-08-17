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
  let activeThreads: Collection<Snowflake, ThreadChannel>;

  try {
    const guild = await fetchGuild(this);
    const fetchedThreads = await guild.channels.fetchActiveThreads();
    activeThreads = fetchedThreads.threads.filter(
      (thread) =>
        thread.type === ChannelType.GuildPublicThread && !thread.archived
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
    return promise.status === "fulfilled";
  }) as PromiseFulfilledResult<Collection<string, Message<boolean>>>[];

  const messageCollections = fulfilledPromises.map(
    (fulfilledPromise) => fulfilledPromise.value
  );

  const fetchedActiveThreads: ThreadData[] = messageCollections.map(
    (msgCollection, index) => {
      return {
        thread: activeThreads.at(index),
        messageCount: msgCollection.size,
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
    const fields = threadDigests[digest].threads.map((threadData) => {
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
      await threadDigests[digest].channel.send({ embeds: [embed] });
    } catch (err) {
      console.error(err);
    }
  }
}
