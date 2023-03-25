import { APIEmbedField, EmbedBuilder, time, TimestampStyles } from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../utilities/ndb2Client/types";

const thumbnails = {
  open: "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134394/Discord%20Assets/4236484_aggyej.png",
  success:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134400/Discord%20Assets/4789514_yqcukf.png",
  failure:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134579/Discord%20Assets/4789514_czvljj.png",
  retired:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679235409/Discord%20Assets/9826793_randif.png",
  closed:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679692889/Discord%20Assets/3468568_cqtnle.png",
};

const getThumbnail = (status: PredictionLifeCycle): string => {
  if (status === PredictionLifeCycle.RETIRED) {
    return thumbnails.retired;
  }

  if (status === PredictionLifeCycle.SUCCESSFUL) {
    return thumbnails.success;
  }

  if (status === PredictionLifeCycle.FAILED) {
    return thumbnails.failure;
  }

  if (status === PredictionLifeCycle.CLOSED) {
    return thumbnails.closed;
  }

  return thumbnails.open;
};

const getAuthor = (status: PredictionLifeCycle): string => {
  if (status === PredictionLifeCycle.RETIRED) {
    return `had predicted that...`;
  }

  if (status === PredictionLifeCycle.CLOSED) {
    return `predicted that...`;
  }

  if (status === PredictionLifeCycle.SUCCESSFUL) {
    return `successfully predicted that...`;
  }

  if (status === PredictionLifeCycle.FAILED) {
    return `unsuccessfully predicted that...`;
  }

  return `predicts that...`;
};

export const generatePredictionEmbed = (
  displayName: string,
  avatarUrl: string,
  prediction: NDB2API.EnhancedPrediction
) => {
  const created = new Date(prediction.created_date);
  const closed = new Date(prediction.closed_date);
  const judgement = new Date(prediction.due_date);
  const retired = new Date(prediction.retired_date);

  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);

  const yesVotes = prediction.votes.filter((vote) => vote.vote);
  const noVotes = prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    author: {
      name: `${displayName} ${getAuthor(prediction.status)}`,
      icon_url: avatarUrl,
    },
    description: prediction.text,
    thumbnail: {
      url: getThumbnail(prediction.status),
    },
    footer: {
      text: `Prediction ID: ${prediction.id}`,
    },
  });

  const fields: APIEmbedField[] = [
    {
      name: `Created`,
      value: `🗓️ ${time(created, TimestampStyles.LongDate)} (${time(
        created,
        TimestampStyles.RelativeTime
      )})`,
    },
  ];

  if (prediction.status === PredictionLifeCycle.CLOSED) {
    fields.push({
      name: "Vote triggered",
      value: `🗓️ ${time(closed, TimestampStyles.LongDate)} (${time(
        closed,
        TimestampStyles.RelativeTime
      )}) `,
    });
  }

  fields.push({
    name: "Original Judgement Day",
    value: `🗓️ ${time(judgement, TimestampStyles.LongDate)} (${time(
      judgement,
      TimestampStyles.RelativeTime
    )}) `,
  });

  if (prediction.status === PredictionLifeCycle.RETIRED) {
    fields.push({
      name: "Retired",
      value: `🗓️ ${time(retired, TimestampStyles.LongDate)} (${time(
        retired,
        TimestampStyles.RelativeTime
      )}) `,
    });
  } else {
    fields.push({
      name: "Bets (Odds)",
      value: `
      ✅ ${endorsements.length} (${prediction.payouts.endorse.toFixed(
        2
      )}) \u200B \u200B \u200B \u200B ❌ ${
        undorsements.length
      } (${prediction.payouts.undorse.toFixed(2)})`,
    });
  }

  if (prediction.status === PredictionLifeCycle.CLOSED) {
    fields.push({
      name: "Voting",
      value:
        "Voting on the outcome of this prediction is now active. Click Yes if you believe this prediction has come true and No if you think this prediction did not come true.",
    });
    fields.push({
      name: "Votes",
      value: `
      ✅ ${yesVotes.length} \u200B \u200B \u200B \u200B ❌ ${noVotes.length}`,
    });
  }

  embed.setFields(fields);

  return embed;
};
