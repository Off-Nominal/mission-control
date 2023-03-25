import {
  EmbedBuilder,
  time,
  TimestampStyles,
  userMention,
} from "@discordjs/builders";
import { ClientUser, GuildMember } from "discord.js";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { NoticeType } from "./sendPublicNotice";

const getAuthor = (
  type: NoticeType,
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: ClientUser
): { name: string; icon_url: string } => {
  if (type === NoticeType.RETIRED) {
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
  [NoticeType.RETIRED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679241808/Discord%20Assets/5267928_bsb9z6.png",
  [NoticeType.TRIGGERED]:
    "https://res.cloudinary.com/dj5enq03a/image/upload/v1679692889/Discord%20Assets/3468568_cqtnle.png",
};

const getDescription = (
  type: NoticeType,
  prediction: NDB2API.EnhancedPrediction,
  triggererId?: string
): string => {
  if (type === NoticeType.RETIRED) {
    return `Prediction #${prediction.id} has been retired by ${userMention(
      prediction.predictor.discord_id
    )} within the allowable adjustment period (${
      process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS
    } hours) since the prediction was made.`;
  }

  if (type === NoticeType.TRIGGERED) {
    return `Prediction #${prediction.id} has been triggered ${
      triggererId ? "manually" : "automatically"
    } by ${
      triggererId ? `user ${userMention(triggererId)}` : "NDB2"
    }. Vote now to determine the outcome of this prediction!`;
  }

  return "Unknown notice type";
};

export const generatePublicNoticeEmbed = (
  prediction: NDB2API.EnhancedPrediction,
  type: NoticeType,
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: ClientUser
): EmbedBuilder => {
  const created = new Date(prediction.created_date);
  const due = new Date(prediction.due_date);
  const triggered = new Date(prediction.triggered_date);
  const retired = new Date(prediction.retired_date);

  const embed = new EmbedBuilder({
    author: getAuthor(type, predictor, triggerer, client),
    thumbnail: {
      url: thumbnails[type],
    },
    title: "Public Notice",
    description: getDescription(type, prediction, triggerer?.id),
  });

  const fields = [
    {
      name: "Original text",
      value: prediction.text,
    },
    {
      name: `Created`,
      value: `🗓️ ${time(created, TimestampStyles.LongDate)} (${time(
        created,
        TimestampStyles.RelativeTime
      )})`,
    },
  ];

  if (
    type === NoticeType.RETIRED ||
    (type === NoticeType.TRIGGERED && triggerer)
  ) {
    fields.push({
      name: "Original Due Date",
      value: `🗓️ ${time(due, TimestampStyles.LongDate)} (${time(
        due,
        TimestampStyles.RelativeTime
      )}) `,
    });
  }

  if (type === NoticeType.RETIRED) {
    fields.push({
      name: "Retired",
      value: `🗓️ ${time(retired, TimestampStyles.LongDate)} (${time(
        retired,
        TimestampStyles.RelativeTime
      )}) `,
    });
  }

  if (type === NoticeType.TRIGGERED) {
    const endorsements = prediction.bets.filter((bet) => bet.endorsed);
    const undorsements = prediction.bets.filter((bet) => !bet.endorsed);
    const yesVotes = prediction.votes.filter((vote) => vote.vote);
    const noVotes = prediction.votes.filter((vote) => !vote.vote);

    fields.push({
      name: "Triggered",
      value: `🗓️ ${time(triggered, TimestampStyles.LongDate)} (${time(
        triggered,
        TimestampStyles.RelativeTime
      )}) `,
    });
    fields.push({
      name: "Bets (Odds)",
      value: `
      ✅ ${endorsements.length} (${prediction.payouts.endorse.toFixed(
        2
      )}) \u200B \u200B \u200B \u200B ❌ ${
        undorsements.length
      } (${prediction.payouts.undorse.toFixed(2)})`,
    });
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
