import { Channel, ChannelType, Client } from "discord.js";
import { channelIds, SpecificChannel } from "../../../types/channelEnums";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

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

export default async function handleNewContent(
  content: ContentFeedItem,
  client: Client,
  target: SpecificChannel.NEWS | SpecificChannel.CONTENT,
  options?: {
    text?: string;
  }
) {
  const { source } = content;

  let channel: Channel;

  try {
    channel = await client.channels.fetch(channelIds[target]);
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
