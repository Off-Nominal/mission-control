// import { EmbedBuilder, userMention } from "discord.js";
// import {
//   APIEnhancedUser,
//   SeasonStatus,
// } from "../../../utilities/ndb2Client/types";

// export const generateUserEmbed = (
//   user: APIEnhancedUser,
//   displayName: string
// ) => {
//   const currentSeasonScore = user.scores.find(
//     (score) => score.season.status === SeasonStatus.CURRENT
//   );
//   const lastSeasonScore = user.scores.find(
//     (score) => score.season.status === SeasonStatus.LAST
//   );

//   const allTime = {
//     points: user.scores.reduce((prev, curr) => prev + curr.points, 0),
//     predictions: {
//       successful: user.scores.reduce(
//         (prev, curr) => prev + curr.predictions.successful,
//         0
//       ),
//       unsuccessful: user.scores.reduce(
//         (prev, curr) => prev + curr.predictions.unsuccessful,
//         0
//       ),
//     },
//     endorsements: {
//       successful: user.scores.reduce(
//         (prev, curr) => prev + curr.endorsements.successful,
//         0
//       ),
//       unsuccessful: user.scores.reduce(
//         (prev, curr) => prev + curr.endorsements.unsuccessful,
//         0
//       ),
//     },
//     undorsements: {
//       successful: user.scores.reduce(
//         (prev, curr) => prev + curr.undorsements.successful,
//         0
//       ),
//       unsuccessful: user.scores.reduce(
//         (prev, curr) => prev + curr.undorsements.unsuccessful,
//         0
//       ),
//     },
//   };

//   const scores = [currentSeasonScore, lastSeasonScore, allTime];
//   const categories = ["Current Season", "Last Season", "All Time"];
//   const fields = scores.map((score, i) => {
//     return {
//       name: categories[i],
//       value: score
//         ? `
//         🎯 \u200B ${score.predictions.successful || 0}:${
//             score.predictions.unsuccessful || 0
//           } \u200B \u200B \u200B \u200B ✅ \u200B ${
//             score.endorsements.successful || 0
//           }:${
//             score.endorsements.unsuccessful || 0
//           } \u200B \u200B \u200B \u200B ❌ \u200B ${
//             score.undorsements.successful || 0
//           }:${
//             score.undorsements.unsuccessful || 0
//           } \u200B \u200B \u200B \u200B 🏆 \u200B ${score.points || 0}
//       `
//         : "No data for this time period",
//     };
//   });

//   const embed = new EmbedBuilder({
//     title: `Stats for ${displayName}`,
//     description: `
//       🎯 \u200B \u200B Good : Bad predictions\n✅ \u200B \u200B Good : Bad endorsements\n❌ \u200B \u200B Good : Bad undorsements\n🏆 \u200B \u200B Total Net Points Awarded
//     `,
//     fields,
//   });

//   return embed;
// };
