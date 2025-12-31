import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  EmbedBuilder,
  userMention,
} from "discord.js";
import { getDetailsButton, getWebButton } from "./helpers/buttons";
import embedFields from "./helpers/fields";
import { NDB2EmbedTemplate } from "./helpers/types";

export const generatePredictionEditEmbed = (
  props: NDB2EmbedTemplate.Args.PredictionEdit
): BaseMessageOptions["embeds"] => {
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
      url: "https://res.cloudinary.com/dj5enq03a/image/upload/v1727366355/Discord%20Assets/dwdqxgufmjugkxpj5x8p.png",
    },
    title: "Prediction Edited",
    description:
      `Prediction #${props.prediction.id} by ${userMention(
        props.prediction.predictor.discord_id
      )} has been edited. Read below for changed fields.` + `\n \u200B`,
    footer: embedFields.standardFooter(
      props.prediction.id,
      props.prediction.driver
    ),
    fields: [
      {
        name: "Prediction",
        value: props.prediction.text + `\n \u200B`,
      },
      embedFields.editedFields(props.edited_fields),
    ],
  });

  return [embed];
};

export const generatePredictionEditComponents = (
  predictionId: string | number
): BaseMessageOptions["components"] => {
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  actionRow.addComponents(
    getDetailsButton(predictionId, "Season", "Details"),
    getWebButton(predictionId)
  );

  return [actionRow];
};
