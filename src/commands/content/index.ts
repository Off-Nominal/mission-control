import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("content")
    .setDescription("Search podcasts")
    .addSubcommand((command) =>
      command
        .setName("search")
        .setDescription("Search podcasts")
        .addStringOption((option) =>
          option
            .setName("show")
            .setDescription("Choose which show to search")
            .setRequired(true)
            .addChoices([
              ["WeMartians", "wm"],
              ["Main Engine Cut Off", "meco"],
              ["Off-Nominal Podcast", "ofn"],
              ["Red Planet Review", "rpr"],
              ["MECO Headlines", "hl"],
            ])
        )
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("How would you like to search?")
            .setRequired(true)
            .addChoices([
              ["By search term", "search"],
              ["By episode number", "episode"],
              ["Just give me the most recent episode", "recent"],
            ])
        )
        .addStringOption((option) =>
          option
            .setName("term")
            .setDescription("Desired search term or episode number")
        )
    )
    .addSubcommand((command) =>
      command.setName("help").setDescription("Get help searching for podcasts")
    ),
].map((command) => command.toJSON());

export default commands;
