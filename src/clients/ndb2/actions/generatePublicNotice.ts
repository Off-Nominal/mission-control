import {
  ActionRowBuilder,
  BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Collection,
  GuildMember,
  userMention,
} from "discord.js";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePublicNoticeEmbed } from "./generatePublicNoticeEmbed";
import { NoticeType } from "./sendPublicNotice";

export const generatePublicNotice = (
  prediction: NDB2API.EnhancedPrediction,
  type: NoticeType,
  betters: string[],
  predictor: GuildMember,
  triggerer: GuildMember | null,
  client: Client
): BaseMessageOptions => {
  const content =
    "Notice to affected parties who have bets on this prediction: " +
    betters.map((b) => userMention(b)).join(", ");

  const embed = generatePublicNoticeEmbed(
    prediction,
    type,
    predictor,
    triggerer,
    client.user
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (type === NoticeType.TRIGGERED) {
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
      .setCustomId(`Details ${prediction.id}`)
      .setLabel("Details")
      .setStyle(ButtonStyle.Secondary)
  );

  return { content, embeds: [embed], components: [actionRow] };
};
