import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommandGroup((group) =>
      group
        .setName("wemartians-patreon")
        .setDescription("WeMartians's Patreon Feed including Red Planet Review")
        .addSubcommand((option) =>
          option
            .setName("recent")
            .setDescription(
              "Get the most recent episode from the WeMartians Patreon Feed"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("search")
            .setDescription(
              "Search the WeMartians Patreon Feed using a search term"
            )
            .addStringOption((option) =>
              option
                .setName("search-term")
                .setDescription("The term to search by.")
                .setRequired(true)
            )
        )
    ),
].map((command) => command.toJSON());

export default commands;
