import { SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Work with Discord Events")
    .addSubcommand((command) =>
      command
        .setName("suggest")
        .setDescription("Suggest a title for an Off-Nominal episode.")
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("The title of the episode")
            .setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("suggestions")
        .setDescription("View current suggestions for Episode titles.")
    ),
].map((command) => command.toJSON());

export default commands;
