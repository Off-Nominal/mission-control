import {
  ActionRowBuilder,
  Base,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
} from "discord.js";
import { NDB2EmbedTemplate } from "./helpers/types";
import { getLeaderboardsButton } from "./helpers/buttons";

export const generateScoresEmbed = (
  props: NDB2EmbedTemplate.Args.Scores
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
        value: `Points: ${props.scores.score.points}\nRank: ${props.scores.score.rank}`,
      },
      {
        name: "💭 Predictions",
        value: `Successful: ${props.scores.predictions.successful}\nFailed: ${props.scores.predictions.failed}\nPending: ${props.scores.predictions.pending}\nRetired: ${props.scores.predictions.retired}\nRank: ${props.scores.predictions.rank}`,
      },
      {
        name: "💵 Bets",
        value: `Successful: ${props.scores.bets.successful}\nFailed: ${props.scores.bets.failed}\nPending: ${props.scores.bets.pending}\nRetired: ${props.scores.bets.retired}\nInvalid: ${props.scores.bets.invalid}\nRank: ${props.scores.bets.rank}`,
      },
      {
        name: "📝 Votes",
        value: `Sycophantic: ${props.scores.votes.sycophantic}\nContrarian: ${props.scores.votes.contrarian}\nPending: ${props.scores.votes.pending}`,
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
