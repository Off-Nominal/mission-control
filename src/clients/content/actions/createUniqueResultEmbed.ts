import { format } from "date-fns";
import { MessageEmbed } from "discord.js";
import { ContentFeedItem } from "../../../listeners/feedListener/contentFeedListener";

export default function createUniqueResultEmbed(result: ContentFeedItem) {
  return new MessageEmbed()
    .setAuthor({ name: result.show })
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.summary)
    .addField("Published", format(result.date, "PPP"))
    .setThumbnail(result.image);
}
