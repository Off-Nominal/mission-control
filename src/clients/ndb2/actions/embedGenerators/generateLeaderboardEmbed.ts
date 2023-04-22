import { APIEmbedField, EmbedBuilder, userMention } from "discord.js";
import { NDB2API } from "../../../../utilities/ndb2Client/types";

export const generateLeaderboardEmbed = (
  type: "points" | "predictions" | "bets",
  leaders: NDB2API.Leader[]
): EmbedBuilder => {
  const fields: APIEmbedField[] = leaders.map((leader) => {
    let value: string;

    if (type === "points") {
      value = `Points: ${leader.points}`;
    }

    if (type === "predictions") {
      value = `Successful predictions: ${leader.predictions.successful}`;
    }

    if (type === "bets") {
      value = `Successful bets: ${leader.bets.successful}`;
    }

    value += ` - ${userMention(leader.discord_id)}`;

    return {
      name: `#${leader.rank}`,
      value,
    };
  });

  const embed = new EmbedBuilder({
    title: `Leaderboard for ${type}`,
    description: `Here are the top ten leaders in ${type}.`,
    fields,
  });

  return embed;
};
