import { Message, MessageEmbed } from "discord.js";
import { FeedListener } from "../../../feeds/feedListener";

export const handleSearchCommand = (
  message: Message,
  feedListener: FeedListener,
  searchTerm: string
) => {
  const results = feedListener.search(searchTerm).slice(0, 3);

  const embed = new MessageEmbed();

  embed
    .setColor("#3e7493")
    .setTitle("Search Results")
    .setAuthor(feedListener.title)
    .setDescription(`Top three results for your search \`${searchTerm}\``)
    .addFields(
      results.map((result) => {
        return {
          name: result.item.title,
          value:
            result.item.description.slice(0, 100) +
            "..." +
            ` [[Link]](${result.item.url})`,
        };
      })
    );

  message.channel.send(embed);
};
