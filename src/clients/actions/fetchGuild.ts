import { Client } from "discord.js";

const GUILD_ID = process.env.GUILD_ID;

export default function fetchGuild(client: Client) {
  return client.guilds.cache.find((guild) => guild.id === GUILD_ID);
}
