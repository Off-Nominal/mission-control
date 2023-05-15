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
        value: `Points: ${scores.score.points}\nRank: ${scores.score.rank}`,
      },
      {
        name: "💭 Predictions",
        value: `Successful: ${scores.predictions.successful}\nFailed: ${scores.predictions.failed}\nPending: ${scores.predictions.pending}\nRetired: ${scores.predictions.retired}\nRank: ${scores.predictions.rank}`,
      },
      {
        name: "💵 Bets",
        value: `Successful: ${scores.bets.successful}\nFailed: ${scores.bets.failed}\nPending: ${scores.bets.pending}\nRetired: ${scores.bets.retired}\nRank: ${scores.bets.rank}`,
      },
      {
        name: "📝 Votes",
        value: `Sycophantic: ${scores.votes.sycophantic}\nContrarian: ${scores.votes.contrarian}\nPending: ${scores.votes.pending}`,
      },
    ],
  });

  return embed;
};
