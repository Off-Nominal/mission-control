import {
  Collection,
  Message,
  MessageEmbed,
  NewsChannel,
  Snowflake,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import fetchGuild from "../../actions/fetchGuild";

type ThreadDigest = {
  channel: TextChannel | NewsChannel;
  threads: ThreadChannel[];
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

  const threadDigests: ThreadDigests = {};
  const fetchPromises: Promise<Collection<string, Message<boolean>>>[] = [];

  activeThreads.forEach((thread) => {
    if (!threadDigests[thread.parentId]) {
      threadDigests[thread.parentId] = {
        channel: thread.parent,
        threads: [],
      };
    }

    threadDigests[thread.parentId].threads.push(thread);
    fetchPromises.push(thread.messages.fetch({}, { force: true }));
  });

  try {
    await Promise.all(fetchPromises);
  } catch (err) {
    console.error(err);
  }

  for (const digest in threadDigests) {
    const fields = threadDigests[digest].threads.map((thread) => {
      return {
        name: thread.name,
        value: `<#${thread.id}> has ${thread.messages.cache.size} messages`,
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
