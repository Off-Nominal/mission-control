import {
  Collection,
  GuildMember,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
} from "discord.js";
import createEventAnnouncementEmbed from "../../../actions/create-event-announcement-embed";
import { Providers } from "../../../providers";
import { UserNotifications } from "../../../providers/db/models/UserNotifications";
import { formatDistance, sub } from "date-fns";
import {
  eventNameIncludes,
  getCountryFromEvent,
  getProviderIdFromEvent,
  isSpaceX,
} from "../../../helpers/rll_utils";
import { NotificationsProvider } from "../../../providers/notifications";

async function notifyNewEvent(
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  userNotifications: UserNotifications,
  notificationsProvider: NotificationsProvider
) {
  if (!event.guild || !event.scheduledStartAt) {
    return;
  }

  const providerId = getProviderIdFromEvent(event);

  // determine event type
  const isStarlink =
    isSpaceX(providerId) && eventNameIncludes(event, "starlink");
  const isUnknownChina =
    getCountryFromEvent(event)?.toLowerCase() === "china" &&
    eventNameIncludes(event, "tbd");

  const result = await userNotifications.fetchNewEventSubscribers({
    isStarlink,
    isUnknownChina,
  });
  const memberIds = result.map((user) => user.discord_id);

  const diff = formatDistance(new Date(), event.scheduledStartAt);

  const content = `New Event: ${event.name} in ${diff}\n\nYou are receiving this DM because you subscribed via the \`/events\` command. If you want to change this, you can update your settings with \`/events subscribe\` or \`/events unsubscribe\` (note: This must be done in the server and not via DM.)`;
  const embed = createEventAnnouncementEmbed(event, "new");

  notificationsProvider.queueDMs(event.guild, memberIds, {
    content,
    embeds: [embed],
  });
}

export default function NewEventNotifications({
  eventsBot,
  models,
  notifications,
}: Providers) {
  //translate Discord event to notification event
  eventsBot.on("guildScheduledEventCreate", (event) => {
    if (!event.isScheduled()) {
      return;
    }

    notifications.emit("events_new", event);
  });

  // handle event
  notifications.on("events_new", (event) => {
    notifyNewEvent(event, models.userNotifications, notifications);
  });
}
