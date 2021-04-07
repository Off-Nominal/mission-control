import { Collection, Message } from "discord.js";

export type SummaryCounterItem = {
  name: string;
  value: string;
  count?: number;
};

export const createFields = (
  collection: Collection<string, Message>
): SummaryCounterItem[] => {
  let fields: SummaryCounterItem[] = [];

  collection.forEach((item, index) => {
    const indexOfExistingItem = fields.findIndex(
      (summaryCounterItem) => summaryCounterItem.name === item.embeds[0].title
    );

    if (indexOfExistingItem > 0) {
      fields[indexOfExistingItem].count++;
    } else {
      fields.push({
        name: item.embeds[0].title,
        value: item.embeds[0].description + ` [[Link]](${item.embeds[0].url})`,
        count: 1,
      });
    }
  });

  return fields.map((field) => {
    const countedField = {
      name:
        field.name +
        ` [Posted ${field.count} time${field.count > 1 ? "s" : ""}]`,
      value: field.value,
    };
    return countedField;
  });
};
