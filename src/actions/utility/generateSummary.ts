import { Message, MessageEmbed } from "discord.js";

export const generateSummary = (message: Message) => {
  const embed = new MessageEmbed();

  embed
    .setTitle("Summary of Today")
    .setDescription("My best attempt at summarizing activity in the Discord.");

  message.channel.send(embed);
};
