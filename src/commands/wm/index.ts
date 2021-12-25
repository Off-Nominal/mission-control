import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommandGroup((group) =>
      group
        .setName("wemartians")
        .setDescription("WeMartians Main Feed")
        .addSubcommand((option) =>
          option
            .setName("recent")
            .setDescription("Get the most recent episode of WeMartians")
        )
        .addSubcommand((option) =>
          option
            .setName("search")
            .setDescription("Find an episode of WeMartians using a search term")
            .addStringOption((option) =>
              option
                .setName("search-term")
                .setDescription("The term to search by")
                .setRequired(true)
            )
        )
        .addSubcommand((option) =>
          option
            .setName("episode-number")
            .setDescription(
              "Fetch an episode of WeMartians by its episode number"
            )
            .addIntegerOption((option) =>
              option
                .setName("ep-number")
                .setDescription("The episode number")
                .setRequired(true)
            )
        )
    ),
].map((command) => command.toJSON());

export default commands;
