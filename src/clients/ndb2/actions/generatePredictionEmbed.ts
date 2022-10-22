import { differenceInDays, format } from "date-fns";
import { EmbedBuilder } from "discord.js";

export const generatePredictionEmbed = (
  displayName: string,
  id: string | number,
  text: string,
  due: Date,
  odds: number = 1.0,
  endorsements: number = 1,
  undorsements: number = 0
) => {
  const embed = new EmbedBuilder({
    title: `${displayName} predicts...`,
    description: `[#${id}]: ${text}`,
    fields: [
      {
        name: "Deets",
        value: `🎲 ${odds}\n
        🗓️ ${format(due, "LLL do, y")}\n
        ⌛ ${differenceInDays(due, new Date())} days until due\n
        ✅ ${endorsements}\n
        ❌ ${undorsements}`,
      },
    ],
  });

  return embed;
};
