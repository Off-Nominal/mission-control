import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";
import { APIEnhancedPrediction } from "../../../utilities/ndb2Client/types";
import { generatePredictionEmbed } from "./generatePredictionEmbed";

export const generatePredictionResponse = (
  interaction: Interaction,
  prediction: APIEnhancedPrediction
): string | MessagePayload | InteractionReplyOptions => {
  const endorsements = prediction.bets.filter((bet) => bet.endorsed);
  const undorsements = prediction.bets.filter((bet) => !bet.endorsed);

  const embed = generatePredictionEmbed(
    (interaction.member as GuildMember).nickname,
    prediction.id,
    prediction.text,
    new Date(prediction.due),
    prediction.odds,
    endorsements.length,
    undorsements.length
  );
  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`Endorse ${prediction.id} ${interaction.id}`)
        .setLabel("Endorse")
        .setStyle(ButtonStyle.Success)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`Undorse ${prediction.id} ${interaction.id}`)
        .setLabel("Undorse")
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
};
