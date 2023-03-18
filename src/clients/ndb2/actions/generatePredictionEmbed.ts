import { EmbedBuilder, time, TimestampStyles } from "discord.js";
import { NDB2API } from "../../../utilities/ndb2Client/types";

const thumbnails = {
  open: "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134394/Discord%20Assets/4236484_aggyej.png",
  success:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134400/Discord%20Assets/4789514_yqcukf.png",
  failure:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134579/Discord%20Assets/4789514_czvljj.png",
};

const getThumbnail = (successful: boolean | null) => {
  if (successful === true) {
    return thumbnails.success;
  }

  if (successful === false) {
    return thumbnails.failure;
  }

  return thumbnails.open;
};

export const generatePredictionEmbed = (
  displayName: string,
  avatarUrl: string,
  prediction: NDB2API.EnhancedPrediction
) => {
  const isClosed = !!prediction.judged_date;
  const created = new Date(prediction.created_date);
  const due = new Date(prediction.due_date);
  const closed = new Date(prediction.closed_date);

  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);

  const adverb = prediction.successful !== null ? "ed" : "s";

  const embed = new EmbedBuilder({
    author: {
      name: `${displayName} predict${adverb}...`,
      icon_url: avatarUrl,
    },
    // title: getTitle(prediction.successful),
    description: prediction.text,
    thumbnail: {
      url: getThumbnail(prediction.successful),
    },
    footer: {
      text: `Prediction ID: ${prediction.id}`,
    },
    fields: [
      {
        name: `Created`,
        value: `🗓️ ${time(created, TimestampStyles.LongDate)} (${time(
          created,
          TimestampStyles.RelativeTime
        )})`,
      },
      {
        name: `${isClosed ? "Closed" : "Judgement Day"}`,
        value: `🗓️ ${time(
          isClosed ? closed : due,
          TimestampStyles.LongDate
        )} (${time(due, TimestampStyles.RelativeTime)}) `,
      },
      {
        name: "Stats",
        value: `
          ✅ ${endorsements.length} (${prediction.payouts.endorse.toFixed(
          2
        )}) \u200B \u200B ❌ ${
          undorsements.length
        } (${prediction.payouts.undorse.toFixed(2)})`,
      },
    ],
  });

  return embed;
};
