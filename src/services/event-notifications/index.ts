import { Providers } from "../../providers";
import { monitorEvents } from "./monitorEvents";
import { notifyNewEvent } from "./notifyNewEvent";
import { setSubscriptions } from "./setSubscriptions";

export default function EventNotifications({ eventsBot, models }: Providers) {
  // Handle New Event notifications
  eventsBot.on("guildScheduledEventCreate", (event) =>
    notifyNewEvent(event, models.user)
  );

  // Handle pre-event notifications based on user settings
  monitorEvents(eventsBot, models.user);

  // Handle subscriptions
  eventsBot.on("interactionCreate", (interaction) => {
    setSubscriptions(interaction, models.user);
  });
}
