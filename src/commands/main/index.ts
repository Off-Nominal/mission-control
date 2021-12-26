import { SlashCommandBuilder } from "@discordjs/builders";
import { spacecraftData } from "../../clients/main/actions/marstime/constants";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommand((command) =>
      command.setName("help").setDescription("Get help searching for podcasts")
    ),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get help with Discord Bots"),
  new SlashCommandBuilder()
    .setName("shunt")
    .setDescription("Move a conversation to a new channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Destination channel")
        .setRequired(true)
        .addChannelType(0)
    )
    .addStringOption((option) =>
      option
        .setName("topic")
        .setDescription("The conversation topic you're shunting")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("thread")
        .setDescription("Target your shunt to a new Thread")
    ),
  new SlashCommandBuilder()
    .setName("marstime")
    .setDescription("Get the current time on Mars")
    .addStringOption((option) =>
      option
        .setName("spacecraft")
        .setDescription("Select a specific spacecraft")
        .addChoices(
          Object.keys(spacecraftData).map<[string, string]>((spacecraft) => [
            spacecraftData[spacecraft].name,
            spacecraft,
          ])
        )
    ),
  new SlashCommandBuilder()
    .setName("summary")
    .setDescription("Summarize activity in the channel over a set time period")
    .addSubcommand((command) =>
      command
        .setName("duration")
        .setDescription(
          "Summarize activity in the channel over a set time period"
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription(
              "Number of hours to summarize back from now (max 24)."
            )
            .setRequired(true)
        )
    )
    .addSubcommand((group) =>
      group.setName("help").setDescription("Help with Summary Bot")
    ),
].map((command) => command.toJSON());

export default commands;
