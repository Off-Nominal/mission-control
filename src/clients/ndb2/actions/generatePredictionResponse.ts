import { add, isAfter, isBefore } from "date-fns";
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

  const dueDate = new Date(prediction.due);

  const embed = generatePredictionEmbed(
    (interaction.member as GuildMember).nickname,
    prediction.id,
    prediction.text,
    dueDate,
    prediction.odds,
    endorsements.length,
    undorsements.length
  );

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
