import { codeBlock, EmbedBuilder, time, TimestampStyles } from "discord.js";

const formatOdds = (odds: number) => {
  const roundedOdds = Math.round(odds * 100) / 100;
  return roundedOdds.toString();
};

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
    description: codeBlock(`[#${id}]: ${text}`),
    fields: [
      {
        name: "Due:",
        value: `🗓️ ${time(due, TimestampStyles.LongDate)} (${time(
          due,
          TimestampStyles.RelativeTime
        )})`,
      },
      {
        name: "Stats",
        value: `✅ ${endorsements}\u200B \u200B \u200B \u200B \u200B ❌ ${undorsements}\u200B \u200B \u200B \u200B \u200B 🎲 ${formatOdds(
          odds
        )}`,
      },
    ],
  });

  return embed;
};
