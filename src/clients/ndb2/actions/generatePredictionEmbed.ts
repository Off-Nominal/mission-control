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
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679231451/Discord%20Assets/5267928_ohcsdq.png",
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

  return thumbnails.open;
};

const getAuthor = (status: PredictionLifeCycle): string => {
  if (status === PredictionLifeCycle.RETIRED) {
    return `had predicted...`;
  }

  if (status === PredictionLifeCycle.SUCCESSFUL) {
    return `successfully predicted...`;
  }

  if (status === PredictionLifeCycle.FAILED) {
    return `unsuccessfully predicted...`;
  }

  return `predicts...`;
};

export const generatePredictionEmbed = (
  displayName: string,
  avatarUrl: string,
  prediction: NDB2API.EnhancedPrediction
) => {
  const created = new Date(prediction.created_date);
  const judgement = new Date(prediction.closed_date ?? prediction.due_date);
  const retired = new Date(prediction.retired_date);

  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);

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
    {
      name: "Judgement Day",
      value: `🗓️ ${time(judgement, TimestampStyles.LongDate)} (${time(
        judgement,
        TimestampStyles.RelativeTime
      )}) `,
    },
  ];

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
      name: "Stats",
      value: `
      ✅ ${endorsements.length} (${prediction.payouts.endorse.toFixed(
        2
      )}) \u200B \u200B ❌ ${
        undorsements.length
      } (${prediction.payouts.undorse.toFixed(2)})`,
    });
  }

  embed.setFields(fields);

  return embed;
};
