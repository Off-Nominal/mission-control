import {
  ActionRowBuilder,
  BaseMessageOptions,
  bold,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { getLeaderboardsButton, getWebButton } from "./helpers/buttons";
import { NDB2EmbedTemplate } from "./helpers/types";
import embedFields from "./helpers/fields";

const trophies = ["🥇", "🥈", "🥉"];

export const generateSeasonEndEmbed = (
  props: NDB2EmbedTemplate.Args.SeasonEnd
): BaseMessageOptions["embeds"] => {
  const embed = new EmbedBuilder({
    title: "Season Results: " + props.results.season.name,
    thumbnail: {
      url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1686757879/Discord%20Assets/trophy_dfczoa.png",
    },
    description: `The season ${bold(
      props.results.season.name
    )} is now complete! Here are the results.`,
    fields: [
      embedFields.date(
        new Date(props.results.season.start),
        "Season Start Date/Time",
        {
          showTime: true,
        }
      ),
      embedFields.date(
        new Date(props.results.season.end),
        "Season End Date/Time",
        {
          showTime: true,
        }
      ),
      {
        name: " \u200B\nPredictions",
        value: `This season, ${bold(
          props.results.predictions.closed.toLocaleString("en-US")
        )} predictions closed. Of these, ${bold(
          props.results.predictions.successes.toLocaleString("en-US")
        )} were successful and ${bold(
          props.results.predictions.failures.toLocaleString("en-US")
        )} were not.\n \u200B`,
      },
      {
        name: "Bets",
        value: `On these ${bold(
          props.results.predictions.closed.toLocaleString("en-US")
        )} predictions, anomalies made ${bold(
          props.results.bets.closed.toLocaleString("en-US")
        )} bets, of which ${bold(
          props.results.bets.successes.toLocaleString("en-US")
        )} were successful and ${bold(
          props.results.bets.failures.toLocaleString("en-US")
        )} were not.\n \u200B`,
      },
      {
        name: "Payouts and Penalties",
        value: `Successful bets paid out a total of ${bold(
          props.results.scores.payouts.toLocaleString("en-US")
        )} points to anomalies this season, and failed bets cost anomalies a total of ${bold(
          Math.abs(props.results.scores.penalties).toLocaleString("en-US")
        )} points.\n\nThe largest payout this season (${bold(
          props.results.largest_payout.value.toLocaleString("en-US")
        )} points) went to ${userMention(
          props.results.largest_payout.better.discord_id
        )} on prediction #${bold(
          props.results.largest_payout.prediction_id.toString()
        )}. The largest penalty (${bold(
          props.results.largest_penalty.value.toLocaleString("en-US")
        )}) went to ${userMention(
          props.results.largest_penalty.better.discord_id
        )} on prediction #${
          props.results.largest_penalty.prediction_id
        }.\n \u200B`,
      },
      {
        name: "Points Leaders",
        value: props.pointsLeaderboard
          .slice(0, 3)
          .map((leader, index) => {
            return `${trophies[index]} ${userMention(
              leader.discord_id
            )} - ${leader.points.toLocaleString("en-US")} points`;
          })
          .join("\n"),
      },
      {
        name: "Predictions Leaders",
        value: props.predictionsLeaderboard
          .slice(0, 3)
          .map((leader, index) => {
            return `${trophies[index]} ${userMention(
              leader.discord_id
            )} - ${leader.predictions.successful.toLocaleString(
              "en-US"
            )} successful predictions`;
          })
          .join("\n"),
      },
      {
        name: "Bets Leaders",
        value: props.betsLeaderboard
          .slice(0, 3)
          .map((leader, index) => {
            return `${trophies[index]} ${userMention(
              leader.discord_id
            )} - ${leader.bets.successful.toLocaleString(
              "en-US"
            )} successful bets`;
          })
          .join("\n"),
      },
    ],
  });

  return [embed];
};

export const generateSeasonEndComponents =
  (): BaseMessageOptions["components"] => {
    const actionRow = new ActionRowBuilder<ButtonBuilder>();
    actionRow.addComponents(getLeaderboardsButton());

    return [actionRow];
  };
