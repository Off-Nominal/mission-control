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
            .setMinValue(30)
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
        .setDescription(
          "Automatically subscribe to and get notifications for Events."
        )
        .addBooleanOption((option) =>
          option
            .setName("event-start")
            .setDescription("Get notified when the event starts")
        )
        .addIntegerOption((option) =>
          option
            .setName("pre-event")
            .setDescription(
              "Get a notification before the event starts (give us a number in minutes before the event starts)"
            )
            .setMaxValue(180)
            .setMinValue(5)
        )
    ),
].map((command) => command.toJSON());

export default commands;
