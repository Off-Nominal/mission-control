import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommandGroup((group) =>
      group
        .setName("off-nominal")
        .setDescription("Off-Nominal Podcast Main Feed")
        .addSubcommand((option) =>
          option
            .setName("recent")
            .setDescription(
              "Get the most recent episode of Off-Nominal Podcast"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("search")
            .setDescription(
              "Find an episode of Off-Nominal Podcast using a search term"
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
              "Fetch an episode of Off-Nominal Podcast by its episode number"
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
