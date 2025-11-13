import { APIEmbedAuthor, Client, GuildMember } from "discord.js";
import { PredictionLifeCycle } from "../../../../../../providers/ndb2-client";
import * as NDB2API from "@offnominal/ndb2-api-types/v2";

export const getPredictedPrefix = (
  status: NDB2API.Entities.Predictions.PredictionLifeCycle
): string => {
  if (status === "retired") {
    return `had predicted that...`;
  }

  if (status === "closed") {
    return `predicted that...`;
  }

  if (status === "successful") {
    return `successfully predicted that...`;
  }

  if (status === "failed") {
    return `unsuccessfully predicted that...`;
  }

  return `predicts that...`;
};

const thumbnails: Record<
  NDB2API.Entities.Predictions.PredictionLifeCycle,
  string
> = {
  [PredictionLifeCycle.OPEN]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679134394/Discord%20Assets/4236484_aggyej.png",
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

export const getThumbnail = (
  status: NDB2API.Entities.Predictions.PredictionLifeCycle
) => {
  return thumbnails[status];
};

export const getAuthor = (
  client: Client,
  triggerer?: GuildMember
): APIEmbedAuthor | undefined => {
  if (triggerer) {
    return {
      name: triggerer.displayName,
      icon_url: triggerer.user.displayAvatarURL(),
    };
  } else if (client.user) {
    return {
      name: client.user.username,
      icon_url: client.user.displayAvatarURL(),
    };
  }
};
