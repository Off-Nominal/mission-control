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
      "Initiate a call to the bot by typing `/podcasts` into the message bar. The system will help you autocomplete your command."
    )
    .addField(
      "Select Feed",
      "Specify which feed you want to search. Currently you can search the following feeds:\nWeMartians - `wemartians`\nMain Engine Cut Off - `meco`\nOff-Nominal - `off-nominal`\nWeMartians Patreon Feed - `wemartians-patreon`\nMain Engine Cut Off Patreon Feed - `meco-patreon`"
    )
    .addField(
      "Specify type of search",
      "`[recent]` - Returns the most recently released episode in the feed\n`[episode-number]` - Returns the episode number specified.\n`[search]` - Will search the episode list for this string in the title and description of the podcast and return the top three matches."
    )
    .addField(
      "Examples:",
      "`/podcasts meco episode-number 74` - Returns Episode T+74 of Main Engine Cut Off\n`/podcasts wemartians Curiosity Rover` - Returns the top three matches in the WeMartians Feed with the string `Curiosity Rover` in the title or description.`\n/podcasts off-nominal recent` - Returns the most recent Off-Nominal Podcast."
    )
    .addField(
      "Note:",
      "Both the WeMartians and Main Engine Cut Off Patreon feeds are not well-optimized for Search Engines. Results may vary when searching those feeds."
    );

  return embed;
};
