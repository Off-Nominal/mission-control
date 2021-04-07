import { Collection, Message } from "discord.js";

export type SummaryCounterItem = {
  name: string;
  value: string;
  count?: number;
};

export const generateNewsReport = (collection: Collection<string, Message>) => {
  const counters: SummaryCounterItem[] = [];

  collection.forEach((newsItem, index) => {
    newsItem.embeds.forEach((embed) => {
      const indexOfExistingItem = counters.findIndex(
        (counter) => counter.name === embed.title
      );

      if (indexOfExistingItem > 0) {
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

  return counters.map((field) => {
    const countedField = {
      name:
        field.name +
        ` [Posted ${field.count} time${field.count > 1 ? "s" : ""}]`,
      value: field.value,
    };
    return countedField;
  });
};
