import { Collection, MessageEmbed, Snowflake, ThreadChannel } from "discord.js";
import fetchTextChannel from "../../actions/fetchChannel";
import fetchGuild from "../../actions/fetchGuild";

const GENERAL_CHANNEL_ID = process.env.GENERALCHANNELID;

export default async function handleThreadDigestSend() {
  let threads: Collection<Snowflake, ThreadChannel>;

  try {
    const guild = await fetchGuild(this);
    const fetchedThreads = await guild.channels.fetchActiveThreads();
    threads = fetchedThreads.threads.filter(
      (thread) => thread.type === "GUILD_PUBLIC_THREAD" && !thread.archived
    );
  } catch (err) {
    return console.error(err);
  }

  const fields = threads.map((thread) => {
    return {
      name: thread.name,
      value: `<#${thread.id}> in ${thread.parent} has ${thread.messageCount} messages`,
    };
  });

  const embed = new MessageEmbed({
    title: "Active Discord Threads",
    description:
      "Sometimes, threads are hard to notice on Discord. Here is your daily summary of the active conversations you might be missing!",
    fields,
  });

  try {
    const channel = await fetchTextChannel(this, GENERAL_CHANNEL_ID);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
  }
}
