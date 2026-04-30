import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { NDB2EmbedTemplate } from "./helpers/types";
import { getLeaderboardsButton } from "./helpers/buttons";

export const generateLeaderboardEmbed = (
  props: NDB2EmbedTemplate.Args.Leaderboard,
): BaseMessageOptions["embeds"] => {
  let timeWindowDescription: string = "all time";

  if (props.seasonIdentifier === "current") {
    timeWindowDescription = "this season";
  } else if (props.seasonIdentifier === "last") {
    timeWindowDescription = "last season";
  }

  const fields: APIEmbedField[] = props.results.map((result) => {
    let value: string = "";
    let rank: string = "";

    if (props.leaderboardType === "points") {
      value = `Points: ${result.points.net}`;
      rank = `#${result.points.rank}`;
    }
    if (props.leaderboardType === "predictions") {
      value = `Successful predictions: ${result.predictions.successful}`;
      rank = `#${result.predictions.rank}`;
    }
    if (props.leaderboardType === "bets") {
      value = `Successful bets: ${result.bets.successful}`;
      rank = `#${result.bets.rank}`;
    }

    value += ` - ${userMention(result.user.discord_id)}`;

    return {
      name: rank,
      value,
    };
  });

  const embed = new EmbedBuilder({
    title: `Leaderboard for ${props.leaderboardType}`,
    description: `Here are the top ten leaders in ${props.leaderboardType} for ${timeWindowDescription}, with ${props.meta.total_count} participants.`,
    fields,
  });

  return [embed];
};

export const generateLeaderboardComponents =
  (): BaseMessageOptions["components"] => {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    actionRow.addComponents(getLeaderboardsButton());
    return [actionRow];
  };
