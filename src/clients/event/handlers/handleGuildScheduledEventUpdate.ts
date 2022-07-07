import { GuildScheduledEvent } from "discord.js";
import { EventBotEvents } from "../../types";

export default function handleGuildScheduledEventUpdate(
  oldEvent: GuildScheduledEvent,
  newEvent: GuildScheduledEvent
) {
  const newStatus = newEvent.status;
  if (newStatus === "ACTIVE") {
    newEvent.client.emit(EventBotEvents.START, newEvent);
  }
  if (newStatus === "COMPLETED") {
    newEvent.client.emit(EventBotEvents.END, newEvent);
  }
}
