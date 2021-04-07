import { Collection, Message, MessageEmbed } from "discord.js";

export type SummaryCounterItem = {
  name: string;
  value: string;
  count?: number;
};

export const generateNewsReport = (
  collection: Collection<string, Message>,
  hourLimit: number
) => {
  const counters: SummaryCounterItem[] = [];

  collection.forEach((newsItem) => {
    newsItem.embeds.forEach((embed) => {
      const indexOfExistingItem = counters.findIndex(
        (counter) => counter.name === embed.title
      );

      if (indexOfExistingItem >= 0) {
        counters[indexOfExistingItem].count++;
      } else {
        counters.push({
          name: embed.title,
          value: embed.description + ` [[Link]](${embed.url})`,
          count: 1,
        });
      }
    });
  });

  const embed = new MessageEmbed();

  counters.sort((a, b) => b.count - a.count);

  const fields = counters.map((field) => {
    const countedField = {
      name:
        field.name +
        ` [Posted ${field.count} time${field.count > 1 ? "s" : ""}]`,
      value: field.value,
    };
    return countedField;
  });

  embed
    .setAuthor(
      "News from Today",
      "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822357/Discord%20Assets/Grin2B_icon_NEWS.png_jqpsal.webp"
    )
    .setDescription(
      `News items posted in this channel in the last ${hourLimit} hours.`
    )
    .addFields(fields);

  return embed;
};