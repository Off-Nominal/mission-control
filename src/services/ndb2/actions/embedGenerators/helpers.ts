import { bold, ClientUser, GuildMember, userMention } from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../providers/ndb2-client";
import { NDB2WebhookEvent } from "../../webhooks";

export const getPredictedPrefix = (status: PredictionLifeCycle): string => {
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

export const getAuthor = (
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION
    | NDB2WebhookEvent.NEW_SNOOZE_CHECK,
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

type ThumbnailLifeCycle =
  | PredictionLifeCycle.RETIRED
  | PredictionLifeCycle.CLOSED
  | PredictionLifeCycle.SUCCESSFUL
  | PredictionLifeCycle.FAILED
  | PredictionLifeCycle.CHECKING;

const thumbnails: Record<ThumbnailLifeCycle, string> = {
  [PredictionLifeCycle.CHECKING]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1726341718/Discord%20Assets/kijdba830md4le7gs77b.png",
  [PredictionLifeCycle.RETIRED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679241808/Discord%20Assets/5267928_bsb9z6.png",
  [PredictionLifeCycle.CLOSED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679692889/Discord%20Assets/3468568_cqtnle.png",
  [PredictionLifeCycle.SUCCESSFUL]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134400/Discord%20Assets/4789514_yqcukf.png",
  [PredictionLifeCycle.FAILED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134579/Discord%20Assets/4789514_czvljj.png",
};

export const getThumbnail = (status: PredictionLifeCycle) => {
  return thumbnails[status];
};

export const getTitle = (type: NDB2WebhookEvent) => {
  if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
    return "Judgement Notice";
  }

  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    return "Retirement Notice";
  }

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    return "Trigger Notice";
  }

  if (type === NDB2WebhookEvent.NEW_SNOOZE_CHECK) {
    return "Just checking in...";
  }

  return "Public Notice";
};

export const getDescription = (
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION
    | NDB2WebhookEvent.NEW_SNOOZE_CHECK,
  prediction: NDB2API.EnhancedPrediction,
  triggererId?: string
): string => {
  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    return (
      `Prediction #${prediction.id} by ${userMention(
        prediction.predictor.discord_id
      )} has been retired by ${userMention(prediction.predictor.discord_id)}.` +
      `\n \u200B`
    );
  }

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    return (
      `Prediction #${prediction.id} by ${userMention(
        prediction.predictor.discord_id
      )} has been triggered ${triggererId ? "manually" : "automatically"} by ${
        triggererId ? `${userMention(triggererId)}` : "NDB2"
      }.` + `\n \u200B`
    );
  }

  if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
    return (
      `Prediction ${prediction.id} by ${userMention(
        prediction.predictor.discord_id
      )} has been judged ${bold(prediction.status)} by the community. ${
        prediction.status === PredictionLifeCycle.SUCCESSFUL
          ? "Nice work"
          : "Better luck next time"
      }!` + `\n \u200B`
    );
  }

  if (type === NDB2WebhookEvent.NEW_SNOOZE_CHECK) {
    return `Prediction #${prediction.id} has reached a check-in date. Please let me know what we should do with it!`;
  }

  return "Unknown notice type";
};
