import { Client } from "discord.js";
import mcconfig from "../mcconfig";

export default function fetchGuild(client: Client) {
  return client.guilds.cache.find(
    (guild) => guild.id === mcconfig.discord.guildId
  );
}
