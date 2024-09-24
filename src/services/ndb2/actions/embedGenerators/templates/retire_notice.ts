import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { getDetailsButton, getWebButton } from "./helpers/buttons";
import embedFields from "./helpers/fields";
import { getThumbnail } from "./helpers/helpers";
import { NDB2API } from "../../../../../providers/ndb2-client";
import { NDB2EmbedTemplate } from "./helpers/types";

export const generateRetireNoticeEmbed = (
  props: NDB2EmbedTemplate.Args.Retirement
): BaseMessageOptions["embeds"] => {
  const created = new Date(props.prediction.created_date);
  const due = new Date(props.prediction.due_date || 0);
  const retired = new Date(props.prediction.retired_date || 0);

  const embed = new EmbedBuilder({
    author: {
      name: props.predictor.displayName,
      icon_url: props.predictor.displayAvatarURL(),
    },
    thumbnail: {
      url: getThumbnail(props.prediction.status),
    },
    title: "Retirement Notice",
    description:
      `Prediction #${props.prediction.id} by ${userMention(
        props.prediction.predictor.discord_id
      )} has been retired by ${userMention(
        props.prediction.predictor.discord_id
      )}.` + `\n \u200B`,
    footer: {
      text: `Prediction ID: ${props.prediction.id}`,
    },
    fields: [
      {
        name: "Prediction",
        value: props.prediction.text + `\n \u200B`,
      },
      embedFields.date(created, "Created", { context: props.context }),
      embedFields.date(due, "Original Due Date"),
      embedFields.date(retired, "Retired"),
    ],
  });

  return [embed];
};

export const generateRetirementNoticeComponents = (
  prediction: NDB2API.EnhancedPrediction
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  actionRow.addComponents(
    getDetailsButton(prediction.id, "Season", "Details"),
    getWebButton(prediction.id)
  );

  return [actionRow];
};
