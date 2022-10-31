import { codeBlock, EmbedBuilder, time, TimestampStyles } from "discord.js";
import { APIEnhancedPrediction } from "../../../utilities/ndb2Client/types";
import { formatOdds } from "./helpers";

export const generatePredictionEmbed = (
  displayName: string,
  prediction: APIEnhancedPrediction
) => {
  const isClosed = !!prediction.judged;
  const created = new Date(prediction.created);
  const due = new Date(prediction.due);
  const closed = new Date(prediction.closed);
  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);
  const wasSuccessful = prediction.successful;

  const adverb = isClosed ? (wasSuccessful ? "" : "un") + "successfully " : "";
  const title = `${
    isClosed ? (wasSuccessful ? "✅" : "❌") : "❓"
  } ${displayName} ${adverb}predict${isClosed ? "ed" : "s"}...`;

  const embed = new EmbedBuilder({
    title,
    description: codeBlock(`[#${prediction.id}]: ${prediction.text}`),
    fields: [
      {
        name: `Created`,
        value: `🗓️ ${time(created, TimestampStyles.LongDate)} (${time(
          created,
          TimestampStyles.RelativeTime
        )})`,
      },
      {
        name: `${isClosed ? "Closed" : "Due"}:`,
        value: `🗓️ ${time(
          isClosed ? closed : due,
          TimestampStyles.LongDate
        )} (${time(due, TimestampStyles.RelativeTime)}) `,
      },
      {
        name: "Stats",
        value: `✅ ${
          endorsements.length
        }\u200B \u200B \u200B \u200B \u200B ❌ ${
          undorsements.length
        }\u200B \u200B \u200B \u200B \u200B 🎲 ${formatOdds(prediction.odds)}`,
      },
    ],
  });

  return embed;
};
