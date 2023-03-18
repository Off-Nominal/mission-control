import { add, isAfter, isBefore } from "date-fns";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePredictionEmbed } from "./generatePredictionEmbed";

export const generatePredictionResponse = async (
  interaction: Interaction,
  prediction: NDB2API.EnhancedPrediction
): Promise<MessagePayload | InteractionReplyOptions> => {
  const predictor = await interaction.guild.members.fetch(
    prediction.predictor.discord_id
  );

  const embed = generatePredictionEmbed(
    predictor.displayName,
    predictor.displayAvatarURL(),
    prediction
  );

  const components = prediction.closed_date
    ? []
    : [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`Endorse ${prediction.id}`)
              .setLabel("Endorse")
              .setStyle(ButtonStyle.Success)
          )
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`Undorse ${prediction.id}`)
              .setLabel("Undorse")
              .setStyle(ButtonStyle.Danger)
          ),
      ];

  return { embeds: [embed], components };
};
