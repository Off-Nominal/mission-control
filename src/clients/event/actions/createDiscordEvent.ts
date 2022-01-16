import { Client, GuildScheduledEventCreateOptions } from "discord.js";
import fetchGuild from "../../actions/fetchGuild";

export default async function createDiscordEvent(
  options: GuildScheduledEventCreateOptions,
  client: Client
) {
  const guild = fetchGuild(client);
  const eventManager = guild.scheduledEvents;
  return await eventManager.create(options);
}
