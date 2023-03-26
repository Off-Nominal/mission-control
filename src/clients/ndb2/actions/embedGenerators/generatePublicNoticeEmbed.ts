import { bold, EmbedBuilder, userMention } from "@discordjs/builders";
import { APIEmbedField, ClientUser, GuildMember } from "discord.js";
import { NDB2WebhookEvent } from "../../../../types/routerTypes";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../utilities/ndb2Client/types";
import embedFields from "./fields";

const getAuthor = (
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION,
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: ClientUser
): { name: string; icon_url: string } => {
  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    return {
      name: predictor.displayName,
      icon_url: predictor.displayAvatarURL(),
    };
  }

  if (triggerer) {
    return {
      name: triggerer.displayName,
      icon_url: triggerer.displayAvatarURL(),
    };
  }

  return {
    name: client.username,
    icon_url: client.displayAvatarURL(),
  };
};

const thumbnails = {
  [PredictionLifeCycle.RETIRED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679241808/Discord%20Assets/5267928_bsb9z6.png",
  [PredictionLifeCycle.CLOSED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679692889/Discord%20Assets/3468568_cqtnle.png",
  [PredictionLifeCycle.SUCCESSFUL]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134400/Discord%20Assets/4789514_yqcukf.png",
  [PredictionLifeCycle.FAILED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134579/Discord%20Assets/4789514_czvljj.png",
};

const getDescription = (
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION,
  prediction: NDB2API.EnhancedPrediction,
  triggererId?: string
): string => {
  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    return `Prediction #${prediction.id} has been retired by ${userMention(
      prediction.predictor.discord_id
    )} within the allowable adjustment period (${
      process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS
    } hours) since the prediction was made.`;
  }

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    return `Prediction #${prediction.id} has been triggered ${
      triggererId ? "manually" : "automatically"
    } by ${
      triggererId ? `user ${userMention(triggererId)}` : "NDB2"
    }. Vote now to determine the outcome of this prediction!`;
  }

  if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
    return `Prediction ${prediction.id} has been judged ${bold(
      prediction.status
    )} by the community. ${
      prediction.status === PredictionLifeCycle.SUCCESSFUL
        ? "Nice work"
        : "Better luck next time"
    }, ${userMention(prediction.predictor.discord_id)}!`;
  }

  return "Unknown notice type";
};

export const generatePublicNoticeEmbed = (
  prediction: NDB2API.EnhancedPrediction,
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION,
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: ClientUser
): EmbedBuilder => {
  const created = new Date(prediction.created_date);
  const due = new Date(prediction.due_date);
  const triggered = new Date(prediction.triggered_date);
  const retired = new Date(prediction.retired_date);
  const closed = new Date(prediction.closed_date);

  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);
  const yesVotes = prediction.votes.filter((vote) => vote.vote);
  const noVotes = prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    author: getAuthor(type, predictor, triggerer, client),
    thumbnail: {
      url: thumbnails[prediction.status],
    },
    title: "Public Notice",
    description: getDescription(type, prediction, triggerer?.id),
    footer: {
      text: `Prediction ID: ${prediction.id}`,
    },
  });

  // Base Fields
  const fields: APIEmbedField[] = [
    {
      name: "Original text",
      value: prediction.text,
    },
    embedFields.date(created, "Created"),
  ];

  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    fields.push(embedFields.date(due, "Original Due Date"));
    fields.push(embedFields.date(retired, "Retired"));
  }

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    triggerer && fields.push(embedFields.date(due, "Original Due Date"));
    fields.push(embedFields.date(triggered, "Triggered Date"));
    fields.push(embedFields.date(closed, "Effective Close Date"));
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

  if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
    fields.push(embedFields.date(closed, "Effective Close Date"));
    fields.push(embedFields.payoutsText(prediction.status, prediction.payouts));
    fields.push(
      embedFields.longPayouts(prediction.status, endorsements, undorsements)
    );
  }

  embed.setFields(fields);

  return embed;
};
