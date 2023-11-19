import { GuildMember } from "discord.js";
import { EventWindow } from "../../../services/eventsListener/EventsListener";
import { fetchPreNotificationSubscribers } from "../../../providers/db/queries/users";
import createEventAnnouncementEmbed from "../actions/createEventAnnouncementEmbed";

export default async function handleEventsMonitored(
  eventWindows: EventWindow[]
) {
  const subscribers = await fetchPreNotificationSubscribers();

  const notifications = eventWindows.map((eventWindow) => {
    const recipients = subscribers.rows
      .filter((sub) => {
        return (
          sub.pre_notification > eventWindow.minTime &&
          sub.pre_notification < eventWindow.maxTime
        );
      })
      .map((sub) => sub.discord_id);

    return {
      event: eventWindow.event,
      recipients,
    };
  });

  notifications.forEach((notification) => {
    if (!notification.recipients.length) {
      return;
    }

    const content = `Happening soon: ${notification.event.name}\n\nThere is an event in the Off-Nominal Discord happening soon!\n\nYou are receiving this DM because you subscribed via the \`/events\` command. If you want to change this, you can update your settings with \`/events subscribe\` or \`/events unsubscribe\` (note: This must be done in the server and not via DM.)`;
    const embed = createEventAnnouncementEmbed(notification.event, "pre");

    notification.recipients.forEach(async (recipient) => {
      let user: GuildMember;

      try {
        user = await notification.event.guild.members.fetch(recipient);
        const dmChannel = await user.createDM();
        await dmChannel.send({ content, embeds: [embed] });
      } catch (err) {
        console.error(
          `Error sending new event notificaiton to ${user.displayName}`
        );
        console.error(err);
      }
    });
  });
}
