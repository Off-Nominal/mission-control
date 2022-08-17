import { BaseInteraction } from "discord.js";
import { generateHelpEmbed } from "../actions/generateHelpEmbed";
import { getRecommendation } from "../actions/getRecommendation";

const BASEURL = process.env.BASEURL;

const recommendMap = {
  best: "highestrate",
  favourite: "favourite",
  random: "random",
};

export default async function handleInteractionCreate(
  interaction: BaseInteraction
) {
  if (!interaction.isChatInputCommand()) return;

  const { options } = interaction;

  const subCommand = options.getSubcommand();
  const group = options.getSubcommandGroup(false);

  if (subCommand === "help") {
    return interaction.reply({ embeds: [generateHelpEmbed()] });
  }

  if (group === "recommend") {
    try {
      const slug = await getRecommendation(recommendMap[subCommand]);
      const content = slug
        ? `${BASEURL}/books/${slug}`
        : "Not enough data for recommendation. If the app hasn't been used in a while, there isn't any recent data to make an informed recommendation.";
      interaction.reply({ content });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "There was an error contacting the Space Book Club API.",
      });
    }
    return;
  }
}
