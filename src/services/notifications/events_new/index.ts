import {
  Collection,
  GuildMember,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
} from "discord.js";
import createEventAnnouncementEmbed from "../../../actions/create-event-announcement-embed";
import { Providers } from "../../../providers";
import { UserNotifications } from "../../../providers/db/models/UserNotifications";
import { formatDistance } from "date-fns";

async function notifyNewEvent(
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  userNotifications: UserNotifications
) {
  const result = await userNotifications.fetchNewEventSubscribers();
  const memberIds = result.map((user) => user.discord_id);
  let subscribers: Collection<string, GuildMember>;

  try {
    subscribers = await event.guild.members.fetch({ user: memberIds });
  } catch (err) {
    console.error("Failed to fetch User subscriber list on new event create");
    return console.error(err);
  }

  const diff = formatDistance(new Date(), event.scheduledStartAt);

  const content = `New Event: ${event.name} in ${diff}\n\nYou are receiving this DM because you subscribed via the \`/events\` command. If you want to change this, you can update your settings with \`/events subscribe\` or \`/events unsubscribe\` (note: This must be done in the server and not via DM.)`;
  const embed = createEventAnnouncementEmbed(event, "new");

  subscribers.forEach(async (subscriber) => {
    try {
      const dmChannel = await subscriber.createDM();
      await dmChannel.send({ content, embeds: [embed] });
    } catch (err) {
      console.error(
        `Error sending new event notificaiton to ${subscriber.displayName}`
      );
      console.error(err);
    }
  });
}

export default function NewEventNotifications({
  eventsBot,
  models,
}: Providers) {
  eventsBot.on("guildScheduledEventCreate", (event) => {
    if (!event.isScheduled()) {
      return;
    }
    notifyNewEvent(event, models.userNotifications);
  });
}
