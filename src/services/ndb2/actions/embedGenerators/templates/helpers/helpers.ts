import { APIEmbedAuthor, Client, GuildMember } from "discord.js";
import { PredictionLifeCycle } from "../../../../../../providers/ndb2-client";

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

type ThumbnailLifeCycle =
  | PredictionLifeCycle.OPEN
  | PredictionLifeCycle.RETIRED
  | PredictionLifeCycle.CLOSED
  | PredictionLifeCycle.SUCCESSFUL
  | PredictionLifeCycle.FAILED
  | PredictionLifeCycle.CHECKING;

const thumbnails: Record<ThumbnailLifeCycle, string> = {
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

export const getThumbnail = (status: PredictionLifeCycle) => {
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
