import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GuildMember,
  userMention,
} from "discord.js";
import { NDB2WebhookEvent } from "../../../types/routerTypes";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePublicNoticeEmbed } from "./embedGenerators/generatePublicNoticeEmbed";

export const generatePublicNotice = (
  prediction: NDB2API.EnhancedPrediction,
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION,
  betters: string[],
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: Client,
  context?: {
    channelId: string;
    messageId: string;
  }
): BaseMessageOptions => {
  const content = betters.map((b) => userMention(b)).join(", ");

  const embed = generatePublicNoticeEmbed(
    prediction,
    type,
    predictor,
    triggerer,
    client.user,
    context
  );

  let addComponents = false;
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    addComponents = true;
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
    addComponents = true;
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`Details ${prediction.id}`)
        .setLabel("Details")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return {
    content,
    embeds: [embed],
    components: addComponents ? [actionRow] : undefined,
  };
};
