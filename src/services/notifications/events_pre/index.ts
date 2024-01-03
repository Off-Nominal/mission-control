import { DMChannel, GuildMember } from "discord.js";
import createEventAnnouncementEmbed from "../../../actions/create-event-announcement-embed";
import {
  EventWindow,
  checkEvents,
  monitorEvents,
} from "../../../actions/monitor-events";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import {
  eventNameIncludes,
  getCountryFromEvent,
  getProviderIdFromEvent,
  isSpaceX,
} from "../../../helpers/rll_utils";
import { parseCommands } from "../../../helpers/parseCommands";

export default function PreEventNotifications({
  eventsBot,
  mcconfig,
  helperBot,
  models,
  notifications,
}: Providers) {
  const notifySubscribers = async (eventWindow: EventWindow) => {
    if (!eventWindow.event.guild) {
      return;
    }

    const providerId = getProviderIdFromEvent(eventWindow.event);

    // determine event type
    const isStarlink =
      isSpaceX(providerId) && eventNameIncludes(eventWindow.event, "starlink");
    const isUnknownChina =
      getCountryFromEvent(eventWindow.event)?.toLowerCase() === "china" &&
      eventNameIncludes(eventWindow.event, "tbd");

    const subscribers =
      await models.userNotifications.fetchPreNotificationSubscribers({
        isStarlink,
        isUnknownChina,
      });

    const recipients = subscribers
      .filter((sub) => {
        return (
          sub.events_pre > eventWindow.minTime &&
          sub.events_pre < eventWindow.maxTime
        );
      })
      .map((sub) => sub.discord_id);

    if (!recipients.length) {
      return;
    }

    const content = `Happening soon: ${eventWindow.event.name}\n\nThere is an event in the Off-Nominal Discord happening soon!\n\nYou are receiving this DM because you subscribed via the \`/events\` command. If you want to change this, you can update your settings with \`/events subscribe\` or \`/events unsubscribe\` (note: This must be done in the server and not via DM.)`;
    const embed = createEventAnnouncementEmbed(eventWindow.event, "pre");

    notifications.queueDMs(eventWindow.event.guild, recipients, {
      content,
      embeds: [embed],
    });
  };

  // Handle pre-event notifications based on user settings
  monitorEvents(eventsBot, (eventWindow) =>
    notifications.emit("events_pre", eventWindow)
  );

  notifications.on("events_pre", notifySubscribers);

  // dev use only
  helperBot.on("messageCreate", (message) => {
    if (mcconfig.env !== "dev") {
      return;
    }

    const [prefix] = parseCommands(message);

    if (prefix !== "!eventpre") {
      return;
    }

    checkEvents(eventsBot, notifySubscribers);
  });
}
