import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";
import { generatePredictionEmbed } from "./generatePredictionEmbed";

export const generatePredictionResponse = (
  interaction: Interaction,
  prediction: {
    id: string | number;
    text: string;
    due: Date;
  }
): string | MessagePayload | InteractionReplyOptions => {
  const embed = generatePredictionEmbed(
    (interaction.member as GuildMember).nickname,
    prediction.id,
    prediction.text,
    prediction.due
  );
  const row = new ActionRowBuilder<ButtonBuilder>()
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
    );

  return { embeds: [embed], components: [row] };
};
