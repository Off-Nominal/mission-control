import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
} from "discord.js";
import {
  NDB2API,
  PredictionLifeCycle,
} from "../../../utilities/ndb2Client/types";
import { generatePredictionEmbed } from "./embedGenerators/generatePredictionEmbed";

export const generatePredictionResponse = (
  predictor: GuildMember | undefined,
  prediction: NDB2API.EnhancedPrediction,
  context?: { messageId: string; channelId: string }
): BaseMessageOptions => {
  const embed = generatePredictionEmbed(
    predictor?.displayName,
    predictor?.displayAvatarURL(),
    prediction,
    context
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

  if (prediction.status === PredictionLifeCycle.CLOSED) {
    actionRow
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`Affirm ${prediction.id}`)
          .setLabel("Yes 👍")
          .setStyle(ButtonStyle.Success)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`Negate ${prediction.id}`)
          .setLabel("No 👎")
          .setStyle(ButtonStyle.Danger)
      );
  }

  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`Details ${prediction.id} Season`)
      .setLabel("Details - Season")
      .setStyle(ButtonStyle.Secondary)
  );
  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`Details ${prediction.id} Alltime`)
      .setLabel("Details - All-Time")
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
