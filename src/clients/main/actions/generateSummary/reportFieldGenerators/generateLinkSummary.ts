import { Collection, Message, EmbedBuilder } from "discord.js";
import { SummaryCounterItem } from "./types";

const embedText = {
  news: {
    title: "News Summary",
    icon: "https://res.cloudinary.com/dj5enq03a/image/upload/v1617822357/Discord%20Assets/Grin2B_icon_NEWS.png_jqpsal.webp",
  },
  youtube: {
    title: "YouTube Summary",
    icon: "https://res.cloudinary.com/dj5enq03a/image/upload/v1617834756/Discord%20Assets/395_Youtube_logo-512_rg8qan.png",
  },
};

export const generateLinkSummary = (
  collection: Collection<string, Message>,
  hourLimit: number,
  channelId: string,
  options?: {
    type?: "news" | "youtube";
  }
) => {
  const type = options.type || "news";
  const copy = embedText[type];
  const counters: SummaryCounterItem[] = [];

  const embed = new EmbedBuilder();
  embed.setAuthor({ name: copy.title, iconURL: copy.icon });

  if (collection.size === 0) {
    return embed.setDescription(
      `There were no links posted to <#${channelId}> in the last ${hourLimit} hours`
    );
  }

  collection.forEach((newsItem) => {
    newsItem.embeds.forEach((embed) => {
      if (!embed.title || !embed.description || !embed.url) {
        return;
      }

      const indexOfExistingItem = counters.findIndex(
        (counter) => counter.name === embed.title
      );

      if (indexOfExistingItem >= 0) {
        counters[indexOfExistingItem].count++;
      } else {
        counters.push({
          name: embed.title,
          value:
            embed.description +
            ` [[Article]](${embed.url}) [[Discussion]](${newsItem.url})`,
          count: 1,
        });
      }
    });
  });

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
    .setDescription(
      `Items posted in <#${channelId}> in the last ${hourLimit} hours.`
    )
    .addFields(fields);

  return embed;
};
