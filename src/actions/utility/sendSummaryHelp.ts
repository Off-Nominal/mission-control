import { Message, MessageEmbed } from "discord.js";

export const sendSummaryHelp = (message: Message) => {
  const embed = new MessageEmbed();

  embed
    .setTitle("Getting channel summaries [BETA]")
    .setDescription(
      "You can generate a summary of links posted to a channel by calling `!summary #` where `#` is a number of hours to go back, up to a maximum of 24.\n\nExample: `!summary 8` returns all the links in the last 8 hours.\n\nIf no number is specified, it will default to 8.\n\nDuplicates will be bundled together to reduce clutter."
    );

  message.channel.send(embed);
};
