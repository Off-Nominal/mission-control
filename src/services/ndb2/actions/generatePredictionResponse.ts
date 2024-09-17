import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
} from "discord.js";
import { generatePredictionEmbed } from "./embedGenerators/generatePredictionEmbed";
import { NDB2API, PredictionLifeCycle } from "../../../providers/ndb2-client";

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

  const actionRow1 = new ActionRowBuilder<ButtonBuilder>();

  if (
    prediction.status === PredictionLifeCycle.OPEN ||
    prediction.status === PredictionLifeCycle.CHECKING
  ) {
    actionRow1
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
    actionRow1
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

  if (
    prediction.status === PredictionLifeCycle.SUCCESSFUL ||
    prediction.status === PredictionLifeCycle.FAILED
  ) {
    actionRow1.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id} Season`)
        .setLabel("Results - Season")
        .setStyle(ButtonStyle.Secondary)
    );
    actionRow1.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id} Alltime`)
        .setLabel("Results - All-Time")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    actionRow1.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id} Season`)
        .setLabel("Details")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  actionRow1.addComponents(
    new ButtonBuilder()
      .setLabel("View on Web")
      .setURL("https://ndb.offnom.com/predictions/" + prediction.id)
      .setStyle(ButtonStyle.Link)
  );

  return { embeds: [embed], components: [actionRow1] };
};
