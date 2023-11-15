import { Client } from "discord.js";
import fetchGuild from "../../../utilities/fetchGuild";
import { EventBotEvents } from "../../../discord_clients/events";

export default async function handleReady(client: Client) {
  try {
    const guild = await fetchGuild(client);
    const events = await guild.scheduledEvents.fetch();
    client.emit(EventBotEvents.RETRIEVED, events, guild.scheduledEvents);
  } catch (err) {
    console.error(err);
  }
}
