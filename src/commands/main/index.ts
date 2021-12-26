import { SlashCommandBuilder } from "@discordjs/builders";

const commands = [
  new SlashCommandBuilder()
    .setName("podcasts")
    .setDescription("Search through the podcasts")
    .addSubcommand((command) =>
      command.setName("help").setDescription("Get help searching for podcasts")
    ),
].map((command) => command.toJSON());

export default commands;
