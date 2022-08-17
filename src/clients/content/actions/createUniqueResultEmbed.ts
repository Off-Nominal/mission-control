import { EmbedBuilder } from "discord.js";
import { ContentFeedItem } from "../handlers/handleNewContent";

export default function createUniqueResultEmbed(feedItem: ContentFeedItem) {
  const { author, title, url, description, summary, date, thumbnail, source } =
    feedItem;

  const embed = new EmbedBuilder({
    author: {
      name: author,
    },
    title,
    url,
    description: summary || description.slice(0, 99).concat("..."),
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
