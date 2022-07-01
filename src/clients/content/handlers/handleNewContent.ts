import { Client, TextChannel } from "discord.js";
import fetchTextChannel from "../../actions/fetchChannel";
import createUniqueResultEmbed from "../actions/createUniqueResultEmbed";

const DEFAULT_TIMEOUT = 0;

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

const channels = {
  news: process.env.NEWS_CHANNEL_ID,
  content: process.env.CONTENTCHANNELID,
};

export default async function handleNewContent(
  content: ContentFeedItem,
  client: Client,
  target: "news" | "content",
  options?: {
    timeout?: number;
    text?: string;
  }
) {
  const { source } = content;
  const timeout = options?.timeout || DEFAULT_TIMEOUT;

  let channel: TextChannel;

  try {
    channel = await fetchTextChannel(client, channels[target]);
  } catch (err) {
    console.error(err);
  }

  setTimeout(() => {
    channel
      .send({
        embeds: [createUniqueResultEmbed(content)],
        content: options?.text,
      })
      .catch((err) => {
        console.error(
          `Error sending message to Discord for update to ${source}`
        );
        console.error(err);
      });
  }, timeout * 1000);
}
