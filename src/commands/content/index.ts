import {
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "@discordjs/builders";

const allShows: Array<[string, string]> = [
  ["WeMartians", "wm"],
  ["Main Engine Cut Off", "meco"],
  ["Off-Nominal Podcast", "ofn"],
  ["Red Planet Review", "rpr"],
  ["MECO Headlines", "hl"],
  ["Off-Nominal Happy Hour", "hh"],
  ["Off-Nominal", "yt"],
];

const mainShows: Array<[string, string]> = [
  ["WeMartians", "wm"],
  ["Main Engine Cut Off", "meco"],
  ["Off-Nominal Podcast", "ofn"],
];

const commands = [
  new SlashCommandBuilder()
    .setName("content")
    .setDescription("Search podcasts")
    .addSubcommand((command) =>
      command
        .setName("search")
        .setDescription("Search podcasts with a search term")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("show")
            .setDescription("Choose which show to search")
            .setRequired(true)
            .addChoices(allShows)
        )
        .addStringOption((option) =>
          option
            .setName("term")
            .setDescription("Desired search term")
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("episode-number")
        .setDescription("Fetch an episode by its number")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("show")
            .setDescription("Choose which show to search")
            .setRequired(true)
            .addChoices(mainShows)
        )
        .addIntegerOption((option) =>
          option
            .setName("episode-number")
            .setDescription("Desired episode number")
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("recent")
        .setDescription("Fetch the most recent podcast")
        .addStringOption(
          new SlashCommandStringOption()
            .setName("show")
            .setDescription("Choose which show to search")
            .setRequired(true)
            .addChoices(allShows)
        )
    )
    .addSubcommand((command) =>
      command.setName("help").setDescription("Get help searching for podcasts")
    )
    .addSubcommand((command) =>
      command
        .setName("rss")
        .setDescription("Show a list of currently subscribed RSS feeds")
    ),
].map((command) => command.toJSON());

export default commands;
