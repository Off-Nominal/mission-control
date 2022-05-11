import { MessageEmbed } from "discord.js";
import letters from "../../../../helpers/pollIndicators";

export default function createPollEmbed(question: string, answers: string[]) {
  const optionsString = answers
    .map((option, index) => `${letters[index]} - ${option}`)
    .join("\n\n");

  const embed = new MessageEmbed({
    title: question,
    description: optionsString,
  });

  return embed;
}
