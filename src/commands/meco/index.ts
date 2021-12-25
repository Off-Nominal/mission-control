import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommandGroup((group) =>
      group
        .setName("meco")
        .setDescription("Main Engine Cut Off Main Feed")
        .addSubcommand((option) =>
          option
            .setName("recent")
            .setDescription(
              "Get the most recent episode of Main Engine Cut Off"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("search")
            .setDescription(
              "Find an episode of Main Engine Cut Off using a search term"
            )
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
              "Fetch an episode of Main Engine Cut Off by its episode number"
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
