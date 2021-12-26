import { SlashCommandBuilder } from "@discordjs/builders";

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
].map((command) => command.toJSON());

export default commands;
