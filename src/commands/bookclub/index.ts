import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("bookclub")
    .setDescription("Interact with the Space Book Club")
    .addSubcommandGroup((group) =>
      group
        .setName("recommend")
        .setDescription("Get a book recommendation")
        .addSubcommand((option) =>
          option
            .setName("random")
            .setDescription(
              "Get a random book recommendation from the Space Book Club"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("best")
            .setDescription(
              "Get the highest ranked book recommendation from the Space Book Club"
            )
        )
        .addSubcommand((option) =>
          option
            .setName("favourite")
            .setDescription(
              "Get the community's favourite book recommendation from the Space Book Club"
            )
        )
    )
    .addSubcommand((option) =>
      option
        .setName("help")
        .setDescription("Get help with the Space Book Club bot")
    ),
].map((command) => command.toJSON());

export default commands;
