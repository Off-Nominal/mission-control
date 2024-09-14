import { APIEmbedField, EmbedBuilder } from "discord.js";
import embedFields from "./fields";
import { getPredictedPrefix } from "./helpers";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../providers/ndb2-client";

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

export const generatePredictionEmbed = (
  displayName: string | undefined,
  avatarUrl: string | undefined,
  prediction: NDB2API.EnhancedPrediction,
  context?: { messageId: string; channelId: string }
) => {
  const created = new Date(prediction.created_date);
  const closed = new Date(prediction.closed_date || 0);
  const due = new Date(prediction.due_date || 0);
  const check = new Date(prediction.check_date || 0);
  const retired = new Date(prediction.retired_date || 0);
  const triggered = new Date(prediction.triggered_date || 0);

  const endorsements = prediction.bets.filter(
    (bet) => bet.endorsed && bet.valid
  );
  const undorsements = prediction.bets.filter(
    (bet) => !bet.endorsed && bet.valid
  );

  const yesVotes = prediction.votes.filter((vote) => vote.vote);
  const noVotes = prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    author: {
      name: `${displayName || "A former discord member"} ${getPredictedPrefix(
        prediction.status
      )}`,
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
    embedFields.date(created, "Created", { context }),
  ];

  if (prediction.status === PredictionLifeCycle.CLOSED) {
    if (prediction.driver === "date") {
      fields.push(embedFields.date(due, "Original Due Date"));
    }
    prediction.triggerer &&
      fields.push(
        embedFields.triggeredDate(
          triggered,
          `Vote Triggered`,
          prediction.triggerer.discord_id
        )
      );
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(
      embedFields.season(prediction.season_id, prediction.season_applicable)
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        prediction.payouts
      )
    );
    fields.push(embedFields.votingNotice());
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (prediction.status === PredictionLifeCycle.SUCCESSFUL) {
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(
      embedFields.season(prediction.season_id, prediction.season_applicable)
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        prediction.payouts
      )
    );
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (prediction.status === PredictionLifeCycle.FAILED) {
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(
      embedFields.season(prediction.season_id, prediction.season_applicable)
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        prediction.payouts
      )
    );
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (
    prediction.status === PredictionLifeCycle.OPEN ||
    prediction.status === PredictionLifeCycle.CHECKING
  ) {
    if (prediction.driver === "date") {
      fields.push(embedFields.date(due, "Due Date"));
    } else {
      fields.push(embedFields.date(check, "Check Date"));
    }
    fields.push(
      embedFields.season(prediction.season_id, prediction.season_applicable)
    );
    fields.push(
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        prediction.payouts
      )
    );
  }

  if (prediction.status === PredictionLifeCycle.RETIRED) {
    fields.push(embedFields.date(retired, "Retired"));
    if (prediction.driver === "date") {
      fields.push(embedFields.date(due, "Original Due Date"));
    } else {
      fields.push(embedFields.date(check, "Original Check Date"));
    }
    fields.push(
      embedFields.season(prediction.season_id, prediction.season_applicable)
    );
  }

  embed.setFields(fields);

  return embed;
};
