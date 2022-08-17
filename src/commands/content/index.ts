import {
  APIApplicationCommandOptionChoice,
  SlashCommandBuilder,
  SlashCommandStringOption,
} from "discord.js";

const allShows: APIApplicationCommandOptionChoice<string>[] = [
  { name: "WeMartians", value: "wm" },
  { name: "Main Engine Cut Off", value: "meco" },
  { name: "Off-Nominal Podcast", value: "ofn" },
  { name: "Red Planet Review", value: "rpr" },
  { name: "MECO Headlines", value: "hl" },
  { name: "Off-Nominal Happy Hour", value: "hh" },
  { name: "Off-Nominal", value: "yt" },
];

const mainShows: APIApplicationCommandOptionChoice<string>[] = [
  { name: "WeMartians", value: "wm" },
  { name: "Main Engine Cut Off", value: "meco" },
  { name: "Off-Nominal Podcast", value: "ofn" },
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
            .setChoices(...allShows)
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
            .addChoices(...mainShows)
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
            .addChoices(...allShows)
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
