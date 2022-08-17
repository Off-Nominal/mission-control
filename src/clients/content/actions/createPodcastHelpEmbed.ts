import { EmbedBuilder } from "discord.js";

export const createPodcastHelpEmbed = () => {
  const embed = new EmbedBuilder();

  embed
    .setTitle("Getting information about the Podcasts")
    .setDescription(
      "You can fetch episodes and get other information about Jake and Anthony's podcasts right here in Discord."
    )
    .addFields([
      {
        name: "Call the bot",
        value:
          "Initiate a call to the bot by typing `/content` into the message bar. The system will help you autocomplete your command.",
      },
      {
        name: "Specify type of search",
        value:
          "`recent` - Returns the most recently released episode in the feed\n`episode-number` - Returns the episode number specified.\n`search` - Will search the episode list for this string in the title and description of the podcast and return the top three matches.",
      },
      {
        name: "Select Show",
        value:
          "Specify which feed you want to search. Currently you can search the following feeds:\n- WeMartians\n- Main Engine Cut Off\n- Off-Nominal Podcast Feed (not YouTube)\n- WeMartians Patreon Feed (episode number not available)\n- Main Engine Cut Off Patreon Feed (episode number not available)",
      },
      {
        name: "Examples:",
        value:
          "`/content episode-number show:Main Engine Cut Off episode-number:74` - Returns Episode T+74 of Main Engine Cut Off\n`/content search show:WeMartians term:Curiosity Rover` - Returns the top three matches in the WeMartians Feed with the string `Curiosity Rover` in the title or description.\n`/content recent show:Off-Nominal Podcast Feed` - Returns the most recent Off-Nominal Podcast.",
      },
      {
        name: "Note:",
        value:
          "Both the WeMartians and Main Engine Cut Off Patreon feeds are not well-optimized for Search Engines. Results may vary when searching those feeds.",
      },
    ]);

  return embed;
};
