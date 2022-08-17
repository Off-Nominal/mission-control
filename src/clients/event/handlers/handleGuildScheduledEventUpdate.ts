import { GuildScheduledEvent, GuildScheduledEventStatus } from "discord.js";
import { EventBotEvents } from "../../../types/eventEnums";

export default function handleGuildScheduledEventUpdate(
  oldEvent: GuildScheduledEvent,
  newEvent: GuildScheduledEvent
) {
  const newStatus = newEvent.status;
  if (newStatus === GuildScheduledEventStatus.Active) {
    newEvent.client.emit(EventBotEvents.START, newEvent);
  }
  if (newStatus === GuildScheduledEventStatus.Completed) {
    newEvent.client.emit(EventBotEvents.END, newEvent);
  }
}
