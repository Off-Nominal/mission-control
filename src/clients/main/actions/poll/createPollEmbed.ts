import { EmbedBuilder } from "discord.js";
import letters from "../../../../helpers/pollIndicators";

export default function createPollEmbed(question: string, answers: string[]) {
  const optionsString = answers
    .map((option, index) => `${letters[index]} - ${option}`)
    .join("\n\n");

  const embed = new EmbedBuilder({
    title: question,
    description: optionsString,
  });

  return embed;
}
