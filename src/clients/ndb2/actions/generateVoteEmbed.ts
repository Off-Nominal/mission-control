import { codeBlock, EmbedBuilder, time, userMention } from "discord.js";
import { APIEnhancedPrediction } from "../../../utilities/ndb2Client/types";

export const generateVoteEmbed = (prediction: APIEnhancedPrediction) => {
  const affirmativeVotes = prediction.result.votes.filter(
    (vote) => vote.affirmative
  );
  const negativeVotes = prediction.result.votes.filter(
    (vote) => !vote.affirmative
  );

  const embed = new EmbedBuilder({
    title: "📣 Vote triggered!",
    description: `${codeBlock(
      `[#${prediction.id}]: ${prediction.text}`
    )}\nPredicted on ${time(new Date(prediction.created))} by ${userMention(
      prediction.predictor.discord_id
    )}.`,
    fields: [
      {
        name: "Votes",
        value: `✅ ${affirmativeVotes.length}\u200B \u200B \u200B \u200B \u200B ❌ ${negativeVotes.length}`,
      },
    ],
  });

  return embed;
};
