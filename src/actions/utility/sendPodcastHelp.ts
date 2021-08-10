import { Message, MessageEmbed } from "discord.js";

export const sendPodcastHelp = (message: Message) => {
  const embed = new MessageEmbed();

  embed
    .setTitle("Getting information about the Podcasts")
    .setDescription(
      "You can search episodes and get other information about Jake and Anthony's podcasts by calling these bots. Each podcast has a prefix to call it."
    )
    .addField(
      "Podcast Bot Prefixes",
      "WeMartians - `!wm`\nMain Engine Cut Off - `!meco`\nOff-Nominal - `!ofn`\nRed Planet Review - `!rpr`\nMECO Headlines - `!hl`"
    )
    .addField(
      "Commands",
      "`[recent]` - Returns the most recently released episode in the feed\n`[number]` - Returns the episode number specified.\n`[searchString]` - Will search the episode list for this string in the title and description of the podcast and return the top three matches."
    )
    .addField(
      "Examples:",
      "`!meco 74` - Returns Episode T+74 of Main Engine Cut Off\n`!wm Curiosity Rover` - Returns the top three matches in the WeMartians Feed with the word Curiosity Rover in the title or description.`\n!ofn recent` - Returns the most recent Off-Nominal Podcast."
    )
    .addField(
      "Note:",
      "Both the Red Planet Review and MECO Headlines feeds are not well-optimized for Search Engines. Results may vary when searching those feeds."
    );

  message.channel.send({ embeds: [embed] });
};
