import { MessageEmbed } from "discord.js";
import { ContentFeedItem } from "../handlers/handleNewContent";

export default function createUniqueResultEmbed(feedItem: ContentFeedItem) {
  const { author, title, url, summary, date, thumbnail, source } = feedItem;

  const embed = new MessageEmbed({
    author: {
      name: author,
    },
    title,
    url,
    description: summary,
    footer: {
      text: source,
    },
    timestamp: date,
    thumbnail: {
      url: thumbnail,
    },
  });

  return embed;
}
