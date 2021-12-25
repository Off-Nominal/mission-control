import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommandGroup((group) =>
      group
        .setName("meco-patreon")
        .setDescription("MECO's Patreon Feed including Headlines")
        .addSubcommand((option) =>
          option
            .setName("recent")
            .setDescription(
              "Get the most recent episode from the MECO Patreon Feed"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("search")
            .setDescription("Search the MECO Patreon Feed using a search term")
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
