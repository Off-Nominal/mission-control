import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Work with Discord Events")
    .addSubcommand((command) =>
      command
        .setName("start")
        .setDescription("Start a new event in #livechat")
        .addStringOption((option) =>
          option
            .setName("url")
            .setDescription(
              "The url where anomalies can watch or listen to the event"
            )
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("How long should the event last (in minutes)?")
            .setRequired(true)
            .setMaxValue(180)
            .setMinValue(5)
        )
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("Title of the event")
            .setRequired(true)
        )
    )
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
        .setDescription("View current suggestsions for Episode titles.")
    ),
].map((command) => command.toJSON());

export default commands;
