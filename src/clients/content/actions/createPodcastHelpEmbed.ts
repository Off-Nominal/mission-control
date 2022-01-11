import { MessageEmbed } from "discord.js";

export const createPodcastHelpEmbed = () => {
  const embed = new MessageEmbed();

  embed
    .setTitle("Getting information about the Podcasts")
    .setDescription(
      "You can search episodes and get other information about Jake and Anthony's podcasts right here in Discord."
    )
    .addField(
      "Call the bot",
      "Initiate a call to the bot by typing `/content search` into the message bar. The system will help you autocomplete your command."
    )
    .addField(
      "Select Show",
      "Specify which feed you want to search. Currently you can search the following feeds:\n- WeMartians\n- Main Engine Cut Off\n- Off-Nominal Podcast Feed (not YouTube)\n- WeMartians Patreon Feed\n- Main Engine Cut Off Patreon Feed"
    )
    .addField(
      "Specify type of search",
      "`Just give me the most recent episode` - Returns the most recently released episode in the feed\n`By episode number` - Returns the episode number specified.\n`By search term` - Will search the episode list for this string in the title and description of the podcast and return the top three matches."
    )
    .addField(
      "Examples:",
      "`/content search show:Main Engine Cut Off type:By episode number 74` - Returns Episode T+74 of Main Engine Cut Off\n`/content search show:WeMartians type:By search term Curiosity Rover` - Returns the top three matches in the WeMartians Feed with the string `Curiosity Rover` in the title or description.`\n/content serch show:Off-Nominal Podcast Feed type:Just give me the most recent episode` - Returns the most recent Off-Nominal Podcast."
    )
    .addField(
      "Note:",
      "Both the WeMartians and Main Engine Cut Off Patreon feeds are not well-optimized for Search Engines. Results may vary when searching those feeds."
    );

  return embed;
};
