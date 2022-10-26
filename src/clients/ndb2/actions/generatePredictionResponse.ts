import { add, isAfter, isBefore } from "date-fns";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";
import { APIEnhancedPrediction } from "../../../utilities/ndb2Client/types";
import { generatePredictionEmbed } from "./generatePredictionEmbed";

export const generatePredictionResponse = async (
  interaction: Interaction,
  prediction: APIEnhancedPrediction
): Promise<MessagePayload | InteractionReplyOptions> => {
  const dueDate = new Date(prediction.due);
  const predictorName = await interaction.guild.members.fetch(
    prediction.predictor.discord_id
  );

  const embed = generatePredictionEmbed(predictorName.displayName, prediction);

  const voteWindow = add(new Date(prediction.created), { days: 7 });
  const lockDate = isBefore(dueDate, voteWindow) ? dueDate : voteWindow;

  const bettingOpen = isAfter(lockDate, new Date());

  const components = bettingOpen
    ? [
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
      ]
    : [];

  return { embeds: [embed], components };
};
