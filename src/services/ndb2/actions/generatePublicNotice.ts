import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GuildMember,
} from "discord.js";
import { generatePublicNoticeEmbed } from "./embedGenerators/generatePublicNoticeEmbed";
import { NDB2API } from "../../../providers/ndb2-client";
import { NDB2WebhookEvent } from "../webhooks";

export const generatePublicNotice = (
  prediction: NDB2API.EnhancedPrediction,
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION,
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: Client,
  context?: {
    channelId: string;
    messageId: string;
  }
): BaseMessageOptions => {
  const embed = generatePublicNoticeEmbed(
    prediction,
    type,
    predictor,
    triggerer,
    client.user,
    context
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
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

  if (
    type === NDB2WebhookEvent.TRIGGERED_PREDICTION ||
    type === NDB2WebhookEvent.RETIRED_PREDICTION
  ) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id}`)
        .setLabel("Details")
        .setStyle(ButtonStyle.Secondary)
    );
  } else {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id} Season`)
        .setLabel("Results - Season")
        .setStyle(ButtonStyle.Secondary)
    );
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id} Alltime`)
        .setLabel("Results - All-Time")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  actionRow.addComponents(
    new ButtonBuilder()
      .setLabel("View on Web")
      .setURL("https://ndb.offnom.com/predictions/" + prediction.id)
      .setStyle(ButtonStyle.Link)
  );

  return {
    embeds: [embed],
    components: [actionRow],
  };
};
