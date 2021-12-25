import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
const { bookclubCommands } = require("./commands");
require("dotenv").config();

const BC_TOKEN = process.env.BOOK_CLUB_BOT_TOKEN_ID;
const GUILD_ID = process.env.GUILD_ID;

const register = (token) => {
  const rest = new REST({ version: "9" }).setToken(token);

  return rest.put(
    Routes.applicationGuildCommands("781234878992744488", GUILD_ID),
    {
      body: bookclubCommands,
    }
  );
};

Promise.all([register(BC_TOKEN)])
  .then(() => {
    console.log("Successfully registered application commands.");
  })
  .catch(console.error);
