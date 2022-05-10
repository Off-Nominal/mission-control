import { GuildScheduledEvent } from "discord.js";

export default function handleGuildScheduledEventUpdate(
  oldEvent: GuildScheduledEvent,
  newEvent: GuildScheduledEvent
) {
  const newStatus = newEvent.status;
  if (newStatus === "ACTIVE") {
    newEvent.client.emit("eventStarted", newEvent);
  }
  if (newStatus === "COMPLETED") {
    newEvent.client.emit("eventEnded", newEvent);
  }
}
