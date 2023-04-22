import { EmbedBuilder, GuildMember } from "discord.js";
import { NDB2API } from "../../../../utilities/ndb2Client/types";

export const generateScoresEmbed = (
  scores: NDB2API.Scores,
  member: GuildMember
): EmbedBuilder => {
  const embed = new EmbedBuilder({
    title: `Statistics for ${member.displayName}`,
    description: `Here are the all-time stats for ${member.displayName}.`,
    fields: [
      {
        name: "🏆 Score",
        value: `
          Points: ${scores.score.points}
          Rank: ${scores.score.rank}`,
      },
      {
        name: "💭 Predictions",
        value: `
          Successful: ${scores.predictions.successful}
          Failed: ${scores.predictions.failed}
          Pending: ${scores.predictions.pending}
          Retired: ${scores.predictions.retired}
          Rank: ${scores.predictions.rank}`,
      },
      {
        name: "💵 Bets",
        value: `
          Successful: ${scores.bets.successful}
          Failed: ${scores.bets.failed}
          Pending: ${scores.bets.pending}
          Retired: ${scores.bets.retired}
          Rank: ${scores.bets.rank}`,
      },
      {
        name: "📝 Votes",
        value: `
          Sycophantic: ${scores.votes.sycophantic}
          Contrarian: ${scores.votes.contrarian}
          Pending: ${scores.votes.pending}`,
      },
    ],
  });

  return embed;
};
