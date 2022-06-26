import { Client, MessageEmbed, TextChannel } from "discord.js";
import { CmsResponseData } from "../../../listeners/newsListener/newsListener";
import fetchTextChannel from "../../actions/fetchChannel";

const CHANNEL_ID = process.env.NEWS_CHANNEL_ID;

export default async function handleNewNews(
  newsItem: {
    rssEntry: any;
    feed: CmsResponseData;
  },
  client: Client
) {
  const embed = new MessageEmbed({
    title: `${newsItem.rssEntry.title}`,
    description: `${newsItem.rssEntry.description}`,
    url: `${newsItem.rssEntry.link}`,
    author: {
      name: `${newsItem.rssEntry.author}`,
      icon_url: `${newsItem.feed.thumbnail || ""}`,
    },
    thumbnail: { url: `${newsItem.feed.thumbnail}` },
    fields: [
      {
        name: "Feed Output",
        value: `\`\`\`json\n${JSON.stringify(newsItem.rssEntry).slice(
          0,
          511
        )}...\n\`\`\``,
      },
    ],
  });

  let newsChannel: TextChannel;

  try {
    newsChannel = await fetchTextChannel(client, CHANNEL_ID);
  } catch (err) {
    console.error(err);
  }

  try {
    await newsChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    await newsChannel.send({
      content: `Failed to send Embed, check the logs, yo.`,
    });
  }
}
