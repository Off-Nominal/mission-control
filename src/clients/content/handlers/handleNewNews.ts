import { Client, MessageEmbed, TextChannel } from "discord.js";
import { CmsResponseData } from "../../../listeners/feedListener/newsListener";
import fetchTextChannel from "../../actions/fetchChannel";
import { stripHtml } from "string-strip-html";

const CHANNEL_ID = process.env.NEWS_CHANNEL_ID;

export default async function handleNewNews(
  newsItem: {
    rssEntry: any;
    feed: CmsResponseData;
  },
  client: Client
) {
  const { rssEntry, feed } = newsItem;

  const embed = new MessageEmbed({
    title: `${rssEntry.title}`,
    description: `${
      stripHtml(rssEntry.summary || rssEntry.description).result
    }`,
    url: `${rssEntry.link}`,
    author: {
      name: `${rssEntry.author}`,
      icon_url: `${feed.thumbnail || ""}`,
    },
    timestamp: new Date(),
    footer: {
      text: "Published",
    },
  });

  feed.thumbnail && embed.setThumbnail(feed.thumbnail);

  let newsChannel: TextChannel;

  try {
    newsChannel = await fetchTextChannel(client, CHANNEL_ID);
  } catch (err) {
    console.error(err);
  }

  try {
    await newsChannel.send({
      embeds: [embed],
      content: "```json\n" + JSON.stringify(rssEntry).slice(0, 1985) + "\n```",
    });
  } catch (err) {
    console.error(err);
    await newsChannel.send({
      content: `Failed to send Embed, check the logs, yo.`,
    });
  }
}
