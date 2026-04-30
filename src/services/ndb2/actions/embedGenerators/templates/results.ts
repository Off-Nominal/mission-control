import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
} from "discord.js";
import { NDB2EmbedTemplate } from "./helpers/types";
import { getLeaderboardsButton } from "./helpers/buttons";

export const generateScoresEmbed = (
  props: NDB2EmbedTemplate.Args.Results,
): BaseMessageOptions["embeds"] => {
  let timeWindowDescription: string = "the all time";

  if (props.seasonIdentifier === "current") {
    timeWindowDescription = "this season's";
  } else if (props.seasonIdentifier === "last") {
    timeWindowDescription = "last season's";
  }

  const embed = new EmbedBuilder({
    title: `Statistics for ${props.member.displayName}`,
    description: `Here are ${timeWindowDescription} stats for ${props.member.displayName}.`,
    fields: [
      {
        name: "🏆 Score",
        value: `Points: ${props.results.points.net}\nRank: ${props.results.points.rank} of ${props.results.total_participants}`,
      },
      {
        name: "💭 Predictions",
        value: `Successful: ${props.results.predictions.successful}\nFailed: ${props.results.predictions.failed}\nPending: ${props.results.predictions.open + props.results.predictions.checking + props.results.predictions.closed}\nRetired: ${props.results.predictions.retired}\nRank: ${props.results.predictions.rank} of ${props.results.total_participants}`,
      },
      {
        name: "💵 Bets",
        value: `Successful: ${props.results.bets.successful}\nFailed: ${props.results.bets.failed}\nPending: ${props.results.bets.pending}\nRetired: ${props.results.bets.retired}\nInvalid: ${props.results.bets.invalid}\nRank: ${props.results.bets.rank} of ${props.results.total_participants}`,
      },
      {
        name: "📝 Votes",
        value: `Yes: ${props.results.votes.yes}\nNo: ${props.results.votes.no}\nAffirmative: ${props.results.votes.affirmative}\nNegative: ${props.results.votes.negative}\nPending: ${props.results.votes.pending}`,
      },
    ],
  });

  return [embed];
};

export const generateScoresComponents =
  (): BaseMessageOptions["components"] => {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    actionRow.addComponents(getLeaderboardsButton());

    return [actionRow];
  };
