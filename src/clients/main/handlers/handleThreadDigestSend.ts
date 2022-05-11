import {
  Collection,
  Message,
  MessageEmbed,
  NewsChannel,
  Snowflake,
  TextChannel,
  ThreadChannel,
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
      (thread) => thread.type === "GUILD_PUBLIC_THREAD" && !thread.archived
    );
  } catch (err) {
    return console.error(err);
  }

  let fetchedActiveThreads: ThreadData[];

  try {
    const fulfilledPromises = await Promise.allSettled(
      activeThreads.map((thread) => fetchMessagesInLast(thread, 72))
    );

    fetchedActiveThreads = (
      fulfilledPromises.filter((promise) => {
        if (promise.status === "rejected") {
          console.error(promise.reason);
        }
        return promise.status === "fulfilled";
      }) as PromiseFulfilledResult<Collection<string, Message<boolean>>>[]
    ).map((msgCollection) => {
      return {
        thread: msgCollection.value.first().channel as ThreadChannel,
        messageCount: msgCollection.value.size,
      };
    });
  } catch (error) {
    return console.error(error);
  }

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

    const embed = new MessageEmbed({
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
