import { SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Work with Discord Events")
    .addSubcommand((command) =>
      command
        .setName("subscribe")
        .setDescription("Get notifications about new Discord events.")
        .addBooleanOption((option) =>
          option
            .setName("new-event")
            .setDescription("Get notified when a new event is created")
        )
        .addIntegerOption((option) =>
          option
            .setName("pre-event")
            .setDescription(
              "Get notified before event starts (give us a number in minutes before the event starts)"
            )
            .setMaxValue(1440)
            .setMinValue(5)
        )
    )
    .addSubcommand((command) =>
      command
        .setName("unsubscribe")
        .setDescription(
          "Unsubscribe from all future automatic event notifications."
        )
    )
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
