// import {
//   ActionRowBuilder,
//   ButtonBuilder,
//   ButtonStyle,
//   codeBlock,
//   EmbedBuilder,
//   MessageCreateOptions,
//   time,
//   userMention,
// } from "discord.js";
// import { APIEnhancedPrediction } from "../../../utilities/ndb2Client/types";
// import { generateVoteEmbed } from "./generateVoteEmbed";
// import { formatOdds } from "./helpers";

// export const generateVoteResponse = (
//   prediction: APIEnhancedPrediction,
//   options: {
//     closer_discord_id?: string;
//   } = {}
// ): MessageCreateOptions => {
//   const embed = generateVoteEmbed(prediction);

//   const components = [
//     new ActionRowBuilder<ButtonBuilder>()
//       .addComponents(
//         new ButtonBuilder()
//           .setCustomId(`Affirm ${prediction.id}`)
//           .setLabel("Prediction is True")
//           .setStyle(ButtonStyle.Success)
//       )
//       .addComponents(
//         new ButtonBuilder()
//           .setCustomId(`Negate ${prediction.id}`)
//           .setLabel("Prediction is False")
//           .setStyle(ButtonStyle.Danger)
//       ),
//   ];

//   return { embeds: [embed], components };
// };
