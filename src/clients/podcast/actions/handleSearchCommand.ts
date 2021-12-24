import { format } from "date-fns";
import { Message, MessageEmbed } from "discord.js";
import { FeedListener } from "../../../listeners/feedListener/feedListener";

export const handleSearchCommand = (
  message: Message,
  feedListener: FeedListener,
  searchTerm: string
) => {
  const results = feedListener.search(searchTerm).slice(0, 3);

  const embed = new MessageEmbed();

  const formatDate = (dateString: string) => {
    const timestamp = new Date(dateString);

    return format(timestamp, "MMM e, yyyy");
  };

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
            result.item.description.slice(0, 160) +
            "..." +
            `\n[[Link]](${result.item.url}) - ${formatDate(result.item.date)}`,
        };
      })
    );

  message.channel.send({ embeds: [embed] });
};
