import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { getDetailsButton, getWebButton } from "./helpers/buttons";
import embedFields from "./helpers/fields";
import { getThumbnail } from "./helpers/helpers";
import { NDB2EmbedTemplate } from "./helpers/types";

export const generateRetireNoticeEmbed = (
  props: NDB2EmbedTemplate.Args.Retirement
): BaseMessageOptions["embeds"] => {
  const created = new Date(props.prediction.created_date);
  const due = new Date(props.prediction.due_date || 0);
  const retired = new Date(props.prediction.retired_date || 0);

  const predictor = props.predictor ?? {
    displayName: "A former discord member",
    displayAvatarURL: () => undefined,
  };

  const embed = new EmbedBuilder({
    author: {
      name: predictor.displayName,
      icon_url: predictor.displayAvatarURL(),
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
      embedFields.date(due, "Original Due Date"),
      embedFields.date(retired, "Retired"),
    ],
  });

  return [embed];
};

export const generateRetirementNoticeComponents = (
  predictionId: string | number
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  actionRow.addComponents(
    getDetailsButton(predictionId, "Season", "Details"),
    getWebButton(predictionId)
  );

  return [actionRow];
};
