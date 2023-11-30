import { EmbedBuilder, bold, userMention } from "discord.js";
import embedFields from "./fields";
import { NDB2API } from "../../../../providers/ndb2-client";

const trophies = ["🥇", "🥈", "🥉"];

export const generateSeasonResultsEmbed = (
  results: NDB2API.SeasonResults,
  predictionsLeaderboard: NDB2API.PredictionsLeader[],
  betsLeaderboard: NDB2API.BetsLeader[],
  pointsLeaderboard: NDB2API.PointsLeader[]
): EmbedBuilder => {
  const embed = new EmbedBuilder({
    title: "Season Results: " + results.season.name,
    thumbnail: {
      url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1686757879/Discord%20Assets/trophy_dfczoa.png",
    },
    description: `The season ${bold(
      results.season.name
    )} is now complete! Here are the results.`,
    fields: [
      embedFields.date(
        new Date(results.season.start),
        "Season Start Date/Time",
        {
          showTime: true,
        }
      ),
      embedFields.date(new Date(results.season.end), "Season End Date/Time", {
        showTime: true,
      }),
      {
        name: " \u200B\nPredictions",
        value: `This season, ${bold(
          results.predictions.closed.toLocaleString("en-US")
        )} predictions closed. Of these, ${bold(
          results.predictions.successes.toLocaleString("en-US")
        )} were successful and ${bold(
          results.predictions.failures.toLocaleString("en-US")
        )} were not.\n \u200B`,
      },
      {
        name: "Bets",
        value: `On these ${bold(
          results.predictions.closed.toLocaleString("en-US")
        )} predictions, anomalies made ${bold(
          results.bets.closed.toLocaleString("en-US")
        )} bets, of which ${bold(
          results.bets.successes.toLocaleString("en-US")
        )} were successful and ${bold(
          results.bets.failures.toLocaleString("en-US")
        )} were not.\n \u200B`,
      },
      {
        name: "Payouts and Penalties",
        value: `Successful bets paid out a total of ${bold(
          results.scores.payouts.toLocaleString("en-US")
        )} points to anomalies this season, and failed bets cost anomalies a total of ${bold(
          Math.abs(results.scores.penalties).toLocaleString("en-US")
        )} points.\n\nThe largest payout this season (${bold(
          results.largest_payout.value.toLocaleString("en-US")
        )} points) went to ${userMention(
          results.largest_payout.better.discord_id
        )} on prediction #${bold(
          results.largest_payout.prediction_id.toString()
        )}. The largest penalty (${bold(
          results.largest_penalty.value.toLocaleString("en-US")
        )}) went to ${userMention(
          results.largest_penalty.better.discord_id
        )} on prediction #${results.largest_penalty.prediction_id}.\n \u200B`,
      },
      {
        name: "Points Leaders",
        value: pointsLeaderboard
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
        value: predictionsLeaderboard
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
        value: betsLeaderboard
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

  return embed;
};
