import { SlashCommandBuilder } from "@discordjs/builders";
import { ChannelType } from "discord-api-types";
import { ChannelTypes } from "discord.js/typings/enums";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommand((command) =>
      command.setName("help").setDescription("Get help searching for podcasts")
    ),
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
    ),
].map((command) => command.toJSON());

export default commands;
