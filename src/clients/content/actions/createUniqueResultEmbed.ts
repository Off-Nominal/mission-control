import { format } from "date-fns";
import { MessageEmbed } from "discord.js";
import { FeedItem } from "../../../listeners/feedListener/feedListener";

export default function createUniqueResultEmbed(result: FeedItem) {
  return new MessageEmbed()
    .setAuthor({ name: result.show })
    .setTitle(result.title)
    .setURL(result.url)
    .setDescription(result.summary)
    .addField("Published", format(result.date, "PPP"))
    .setThumbnail(result.image);
}
