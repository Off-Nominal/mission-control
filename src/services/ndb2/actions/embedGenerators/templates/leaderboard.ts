import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { NDB2API } from "../../../../../providers/ndb2-client";
import { NDB2EmbedTemplate } from "./helpers/types";
import { getLeaderboardsButton } from "./helpers/buttons";

export const generateLeaderboardEmbed = (
  props: NDB2EmbedTemplate.Args.Leaderboard
): BaseMessageOptions["embeds"] => {
  let timeWindowDescription: string = "all time";

  if (props.seasonIdentifier === "current") {
    timeWindowDescription = "this season";
  } else if (props.seasonIdentifier === "last") {
    timeWindowDescription = "last season";
  }

  const fields: APIEmbedField[] = props.leaders.map(
    (
      leader:
        | NDB2API.PointsLeader
        | NDB2API.BetsLeader
        | NDB2API.PredictionsLeader
    ) => {
      let value: string = "";

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
    title: `Leaderboard for ${props.type}`,
    description: `Here are the top ten leaders in ${props.type} for ${timeWindowDescription}.`,
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
