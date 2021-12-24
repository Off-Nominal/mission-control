import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
require("dotenv").config();

const BC_TOKEN = process.env.BOOK_CLUB_BOT_TOKEN_ID;

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
            .setDescription("Get a random book from the app")
        )
        .addSubcommand((option) =>
          option
            .setName("best")
            .setDescription("Get the highest ranked book from the app")
        )
        .addSubcommand((option) =>
          option
            .setName("favourite")
            .setDescription("Get the community's favourite book from the app")
        )
    )
    .addSubcommand((option) =>
      option.setName("help").setDescription("Get help with the Book Club bot")
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(BC_TOKEN);

console.log(BC_TOKEN);

rest
  .put(
    Routes.applicationGuildCommands("781234878992744488", "781235493118672946"),
    { body: commands }
  )
  .then(() => console.log("Successfully registered application commands."))
  .catch(console.error);
