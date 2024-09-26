import {
  ActionRowBuilder,
  APIEmbedField,
  BaseMessageOptions,
  bold,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { getDetailsButton, getWebButton } from "./helpers/buttons";
import embedFields from "./helpers/fields";
import { getAuthor, getThumbnail } from "./helpers/helpers";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../../../providers/ndb2-client";
import { NDB2EmbedTemplate } from "./helpers/types";

export const generateJudgementNoticeEmbed = (
  props: NDB2EmbedTemplate.Args.Judgement
): BaseMessageOptions["embeds"] => {
  const created = new Date(props.prediction.created_date);
  const closed = new Date(props.prediction.closed_date || 0);

  const embed = new EmbedBuilder({
    author: getAuthor(props.client),
    thumbnail: {
      url: getThumbnail(props.prediction.status),
    },
    title: "Judgement Notice",
    description:
      `Prediction ${props.prediction.id} by ${userMention(
        props.prediction.predictor.discord_id
      )} has been judged ${bold(props.prediction.status)} by the community. ${
        props.prediction.status === PredictionLifeCycle.SUCCESSFUL
          ? "Nice work"
          : "Better luck next time"
      }!` + `\n \u200B`,
    footer: embedFields.standardFooter(
      props.prediction.id,
      props.prediction.driver
    ),
    fields: [
      {
        name: "Prediction",
        value: props.prediction.text + `\n \u200B`,
      },
      embedFields.date(created, "Created", { context: props.context }),
      embedFields.date(closed, "Effective Close Date"),
    ],
  });

  return [embed];
};

export const generateJudgementNoticeComponents = (
  prediction: NDB2API.EnhancedPrediction
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  actionRow.addComponents(
    getDetailsButton(prediction.id, "Season", "Details"),
    getWebButton(prediction.id)
  );

  return [actionRow];
};
