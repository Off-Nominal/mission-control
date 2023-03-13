import { add, isAfter, isBefore } from "date-fns";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  InteractionReplyOptions,
  MessagePayload,
} from "discord.js";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import { generatePredictionEmbed } from "./generatePredictionEmbed";

export const generatePredictionResponse = async (
  interaction: Interaction,
  prediction: NDB2API.EnhancedPrediction
): Promise<MessagePayload | InteractionReplyOptions> => {
  // const dueDate = new Date(prediction.due_date);

  const predictorName = await interaction.guild.members.fetch(
    prediction.predictor.discord_id
  );

  const embed = generatePredictionEmbed(predictorName.displayName, prediction);

  // const voteWindow = add(new Date(prediction.created_date), { days: 7 });
  // const lockDate = isBefore(dueDate, voteWindow) ? dueDate : voteWindow;

  // const bettingOpen = isAfter(lockDate, new Date());

  // const components = bettingOpen
  //   ? [
  //       new ActionRowBuilder<ButtonBuilder>()
  //         .addComponents(
  //           new ButtonBuilder()
  //             .setCustomId(`Endorse ${prediction.id}`)
  //             .setLabel("Endorse")
  //             .setStyle(ButtonStyle.Success)
  //         )
  //         .addComponents(
  //           new ButtonBuilder()
  //             .setCustomId(`Undorse ${prediction.id}`)
  //             .setLabel("Undorse")
  //             .setStyle(ButtonStyle.Danger)
  //         ),
  //     ]
  //   : [];

  return { embeds: [embed] };
};
