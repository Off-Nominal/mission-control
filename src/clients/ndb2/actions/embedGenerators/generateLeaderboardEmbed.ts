import { APIEmbedField, EmbedBuilder, userMention } from "discord.js";
import { NDB2API } from "../../../../utilities/ndb2Client/types";

export const generateLeaderboardEmbed = (
  type: "points" | "predictions" | "bets",
  leaders:
    | NDB2API.PointsLeader[]
    | NDB2API.BetsLeader[]
    | NDB2API.PredictionsLeader[],
  seasonIdentifier?: "current" | "last"
): EmbedBuilder => {
  let timeWindowDescription: string = "all time";

  if (seasonIdentifier === "current") {
    timeWindowDescription = "this season";
  } else if (seasonIdentifier === "last") {
    timeWindowDescription = "last season";
  }

  const fields: APIEmbedField[] = leaders.map(
    (
      leader:
        | NDB2API.PointsLeader
        | NDB2API.BetsLeader
        | NDB2API.PredictionsLeader
    ) => {
      let value: string;

      if ("points" in leader) {
        value = `Points: ${leader.points}`;
      }

      if ("predictions" in leader) {
        value = `Successful predictions: ${leader.predictions.successful}`;
      }

      if ("bets" in leader) {
        value = `Successful bets: ${leader.bets.successful}`;
      }

      value += ` - ${userMention(leader.discord_id)}`;

      return {
        name: `#${leader.rank}`,
        value,
      };
    }
  );

  const embed = new EmbedBuilder({
    title: `Leaderboard for ${type}`,
    description: `Here are the top ten leaders in ${type} for ${timeWindowDescription}.`,
    fields,
  });

  return embed;
};
