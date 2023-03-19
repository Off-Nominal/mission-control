import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../utilities/ndb2Client/types";
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

  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (prediction.status === PredictionLifeCycle.OPEN) {
    actionRow
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
  }

  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`Details ${prediction.id}`)
      .setLabel("Details")
      .setStyle(ButtonStyle.Secondary)
  );
  // .addComponents(
  //   new ButtonBuilder()
  //     .setLabel("Web")
  //     .setURL("https://www.offnom.com")
  //     .setStyle(ButtonStyle.Link)
  // ),

  return { embeds: [embed], components: [actionRow] };
};
