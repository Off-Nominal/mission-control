import { APIEmbedField, EmbedBuilder } from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../utilities/ndb2Client/types";
import embedFields from "./fields";

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
  const triggered = new Date(prediction.triggered_date);

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

  const fields: APIEmbedField[] = [embedFields.date(created, "Created")];

  if (prediction.status === PredictionLifeCycle.CLOSED) {
    prediction.triggerer &&
      fields.push(
        embedFields.triggeredDate(
          triggered,
          `Vote Triggered`,
          prediction.triggerer.discord_id
        )
      );
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(embedFields.date(judgement, "Original Judgement Day"));
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
      embedFields.shortBets(
        endorsements.length,
        undorsements.length,
        prediction.payouts
      )
    );
    fields.push(embedFields.shortVotes(yesVotes.length, noVotes.length));
  }

  if (prediction.status === PredictionLifeCycle.OPEN) {
    fields.push(embedFields.date(judgement, "Judgement Day"));
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
    fields.push(embedFields.date(judgement, "Original Judgement Day"));
  }

  embed.setFields(fields);

  return embed;
};
