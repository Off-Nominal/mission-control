import {
  Client,
  GuildScheduledEvent,
  GuildScheduledEventCreateOptions,
  GuildScheduledEventStatus,
} from "discord.js";
import fetchGuild from "../helpers/fetchGuild";

export default async function createDiscordEvent(
  options: GuildScheduledEventCreateOptions,
  client: Client
): Promise<GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>> {
  const guild = fetchGuild(client);
  const eventManager = guild.scheduledEvents;
  const event = await eventManager.create(options);

  if (!event.isScheduled()) {
    throw new Error("Event was not scheduled");
  } else {
    return event;
  }
}
