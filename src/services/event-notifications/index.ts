import { Providers } from "../../providers";
import { monitorEvents } from "./monitorEvents";
import { notifyNewEvent } from "./notifyNewEvent";

export default function EventNotifications({ eventsBot, models }: Providers) {
  // Handle new Event notifications
  eventsBot.on("guildScheduledEventCreate", (event) =>
    notifyNewEvent(event, models.user)
  );

  // Handle pre-event notifications based on user settings
  monitorEvents(eventsBot, models.user);
}
