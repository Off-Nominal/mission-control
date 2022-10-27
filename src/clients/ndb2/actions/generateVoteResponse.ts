import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
  EmbedBuilder,
  MessageCreateOptions,
  time,
  userMention,
} from "discord.js";
import { APIEnhancedPrediction } from "../../../utilities/ndb2Client/types";
import { formatOdds } from "./helpers";

export const generateVoteResponse = (
  prediction: APIEnhancedPrediction,
  options: {
    closer_discord_id?: string;
  } = {}
): MessageCreateOptions => {
  const affirmativeVotes = prediction.result.votes.filter(
    (vote) => vote.affirmative
  );
  const negativeVotes = prediction.result.votes.filter(
    (vote) => !vote.affirmative
  );

  const embed = new EmbedBuilder({
    title: "📣 Vote triggered!",
    description: `${codeBlock(
      `[${prediction.id}]: ${prediction.text}`
    )}\nPredicted on ${time(new Date(prediction.created))} by ${userMention(
      prediction.predictor.discord_id
    )}.`,
    fields: [
      {
        name: "Votes",
        value: `✅ ${affirmativeVotes.length}\u200B \u200B \u200B \u200B \u200B ❌ ${negativeVotes.length}`,
      },
    ],
  });

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`Affirm ${prediction.id}`)
          .setLabel("Prediction is True")
          .setStyle(ButtonStyle.Success)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`Negate ${prediction.id}`)
          .setLabel("Prediction is False")
          .setStyle(ButtonStyle.Danger)
      ),
  ];

  return { embeds: [embed], components };
};
