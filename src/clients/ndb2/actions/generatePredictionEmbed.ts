import { codeBlock, EmbedBuilder, time, TimestampStyles } from "discord.js";
import { NDB2API } from "../../../utilities/ndb2Client/types";
// import { formatOdds } from "./helpers";

export const generatePredictionEmbed = (
  displayName: string,
  prediction: NDB2API.EnhancedPrediction
) => {
  const isClosed = !!prediction.judged_date;
  const created = new Date(prediction.created_date);
  const due = new Date(prediction.due_date);
  const closed = new Date(prediction.closed_date);

  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);

  const wasSuccessful = prediction.successful;

  const adverb = isClosed ? (wasSuccessful ? "" : "un") + "successfully " : "";

  const title = `${
    isClosed ? (wasSuccessful ? "✅" : "❌") : "❓"
  } ${displayName} ${adverb}predict${isClosed ? "ed" : "s"}...`;

  const embed = new EmbedBuilder({
    title,
    description: `[#${prediction.id}]: ${prediction.text}`,
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
        value: `
          ✅ ${endorsements.length} (${prediction.payouts.endorse}) \u200B \u200B ❌ ${undorsements.length} (${prediction.payouts.undorse})`,
      },
    ],
  });

  return embed;
};
