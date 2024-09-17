import { bold, EmbedBuilder, userMention } from "@discordjs/builders";
import { APIEmbedField, ClientUser, GuildMember } from "discord.js";
import embedFields from "./fields";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../providers/ndb2-client";
import { NDB2WebhookEvent } from "../../webhooks";
import { getAuthor, getDescription, getThumbnail, getTitle } from "./helpers";

export const generatePublicNoticeEmbed = (
  prediction: NDB2API.EnhancedPrediction,
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION
    | NDB2WebhookEvent.NEW_SNOOZE_CHECK,
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: ClientUser,
  context?: {
    channelId: string;
    messageId: string;
  }
): EmbedBuilder => {
  if (prediction.status === PredictionLifeCycle.OPEN) {
    throw new Error("Cannot generate public notice for open prediction");
  }

  const created = new Date(prediction.created_date);
  const due = new Date(prediction.due_date || 0);
  const triggered = new Date(prediction.triggered_date || 0);
  const retired = new Date(prediction.retired_date || 0);
  const closed = new Date(prediction.closed_date || 0);

  const endorsements = prediction.bets.filter(
    (bet) => bet.endorsed && bet.valid
  );
  const undorsements = prediction.bets.filter(
    (bet) => !bet.endorsed && bet.valid
  );
  const invalidBets = prediction.bets.filter((bet) => !bet.valid);

  const yesVotes = prediction.votes.filter((vote) => vote.vote);
  const noVotes = prediction.votes.filter((vote) => !vote.vote);

  const embed = new EmbedBuilder({
    author: getAuthor(type, predictor, triggerer, client),
    thumbnail: {
      url: getThumbnail(prediction.status),
    },
    title: getTitle(type),
    description: getDescription(type, prediction, triggerer?.id),
    footer: {
      text: `Prediction ID: ${prediction.id}`,
    },
  });

  // Base Fields
  const fields: APIEmbedField[] = [
    {
      name: "Prediction",
      value: prediction.text + `\n \u200B`,
    },
    embedFields.date(created, "Created", { context }),
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

  if (
    type === NDB2WebhookEvent.JUDGED_PREDICTION &&
    (prediction.status === PredictionLifeCycle.SUCCESSFUL ||
      prediction.status === PredictionLifeCycle.FAILED)
  ) {
    fields.push(embedFields.date(closed, "Effective Close Date"));
  }

  if (type === NDB2WebhookEvent.NEW_SNOOZE_CHECK) {
    fields.push({
      name: "Is this prediction ready to be triggered?",
      value:
        "If so, please trigger it using the regular NDB command (`/predict trigger`) and provide the appropriate backdate for the trigger.",
    });
    fields.push({
      name: "Want me to check back later?",
      value:
        "Choose the most appropriate snooze duration below to have me check back later. I'll use the first option that gets three votes.",
    });
  }

  embed.setFields(fields);

  return embed;
};
