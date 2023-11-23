import { Client, GuildMember, GuildScheduledEvent } from "discord.js";
import fetchGuild from "../../helpers/fetchGuild";
import { User } from "../../providers/db/models/User";
import createEventAnnouncementEmbed from "../../actions/create-event-announcement-embed";

const FIVE_MINS_IN_MS = 300000;
const MS_IN_A_SEC = 1000;
const SEC_IN_AN_MIN = 60;

export type EventWindow = {
  event: GuildScheduledEvent;
  minTime: number;
  maxTime: number;
};

export function monitorEvents(client: Client, user: User) {
  setInterval(async () => {
    const guild = fetchGuild(client);
    if (!guild) return;

    const events = await guild.scheduledEvents.fetch();

    const eventWindows = events.map((event): EventWindow => {
      const eventStartTimeStamp = event.scheduledStartAt.getTime();
      const now = Date.now();

      const maxTime = (eventStartTimeStamp - now) / MS_IN_A_SEC / SEC_IN_AN_MIN;
      const minTime = maxTime - 5;

      return {
        event,
        minTime,
        maxTime,
      };
    });

    const subscribers = await user.fetchPreNotificationSubscribers();

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
  }, FIVE_MINS_IN_MS);
}
