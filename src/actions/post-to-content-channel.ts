import { Channel, ChannelType, Client } from "discord.js";
import createUniqueResultEmbed from "../services/content-search/createUniqueResultEmbed";
import mcconfig from "../mcconfig";

export type ContentFeedItem = {
  author: string;
  title: string;
  date: Date;
  url: string;
  thumbnail: string;
  description?: string;
  summary: string;
  id?: string;
  source: string;
  albumArt?: string;
};

export async function postContent(
  content: ContentFeedItem,
  client: Client,
  target: "news" | "content",
  options?: {
    text?: string;
  }
) {
  const { source } = content;

  let channel: Channel;

  try {
    channel = await client.channels.fetch(mcconfig.discord.channels[target]);
  } catch (err) {
    console.error(err);
  }

  if (channel.type !== ChannelType.GuildAnnouncement) {
    return;
  }

  channel
    .send({
      embeds: [createUniqueResultEmbed(content)],
      content: options?.text,
    })
    .catch((err) => {
      console.error(`Error sending message to Discord for update to ${source}`);
      console.error(err);
    })
    .then((msg) => {
      msg && target === "content" && msg.crosspost();
    })
    .catch((err) => {
      console.error("Unable to publish content");
      console.error(err);
    });
}
