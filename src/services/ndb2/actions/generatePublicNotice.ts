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

const getAffirmButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setCustomId(`Affirm ${predictionId}`)
    .setLabel("Yes 👍")
    .setStyle(ButtonStyle.Success);
};

const getNegateButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setCustomId(`Negate ${predictionId}`)
    .setLabel("No 👎")
    .setStyle(ButtonStyle.Danger);
};

const getSnoozeButton = (
  predictionId: string | number,
  days,
  label: string
) => {
  return new ButtonBuilder()
    .setCustomId(`Snooze ${predictionId} ${days}`)
    .setLabel(`⏰ ${label}`)
    .setStyle(ButtonStyle.Secondary);
};

const getDetailsButton = (
  predictionId: string | number,
  type: "Season" | "Alltime",
  label: string
) => {
  return new ButtonBuilder()
    .setCustomId(`Details ${predictionId} ${type}`)
    .setLabel(label)
    .setStyle(ButtonStyle.Secondary);
};

const getWebButton = (predictionId: string | number) => {
  return new ButtonBuilder()
    .setLabel("View on Web")
    .setURL("https://ndb.offnom.com/predictions/" + predictionId)
    .setStyle(ButtonStyle.Link);
};

export const generatePublicNotice = (
  prediction: NDB2API.EnhancedPrediction,
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION
    | NDB2WebhookEvent.NEW_SNOOZE_CHECK,
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
    actionRow.addComponents(
      getAffirmButton(prediction.id),
      getNegateButton(prediction.id),
      getDetailsButton(prediction.id, "Season", "Details"),
      getWebButton(prediction.id)
    );

    return {
      embeds: [embed],
      components: [actionRow],
    };
  }

  if (type === NDB2WebhookEvent.NEW_SNOOZE_CHECK) {
    actionRow.addComponents(
      getSnoozeButton(prediction.id, 1, "1 Day"),
      getSnoozeButton(prediction.id, 7, "1 Week"),
      getSnoozeButton(prediction.id, 30, "1 Month"),
      getSnoozeButton(prediction.id, 90, "1 Quarter"),
      getSnoozeButton(prediction.id, 365, "1 Year")
    );

    const actionRow2 = new ActionRowBuilder<ButtonBuilder>();
    actionRow2.addComponents(getWebButton(prediction.id));

    return {
      embeds: [embed],
      components: [actionRow, actionRow2],
    };
  }

  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    actionRow.addComponents(
      getDetailsButton(prediction.id, "Season", "Details"),
      getWebButton(prediction.id)
    );

    return {
      embeds: [embed],
      components: [actionRow],
    };
  }

  if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
    actionRow.addComponents(
      getDetailsButton(prediction.id, "Season", "Results - Season"),
      getDetailsButton(prediction.id, "Alltime", "Results - All-time"),
      getWebButton(prediction.id)
    );

    return {
      embeds: [embed],
      components: [actionRow],
    };
  }

  actionRow.addComponents(getWebButton(prediction.id));

  return {
    embeds: [embed],
    components: [actionRow],
  };
};
