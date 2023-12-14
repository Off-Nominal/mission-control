import { DMChannel, GuildMember } from "discord.js";
import createEventAnnouncementEmbed from "../../actions/create-event-announcement-embed";
import { EventWindow, monitorEvents } from "../../actions/monitor-events";
import { Providers } from "../../providers";
import { notifyNewEvent } from "./notifyNewEvent";
import { setSubscriptions } from "./setSubscriptions";
import { LogInitiator, LogStatus, Logger } from "../../logger/Logger";

export default function EventNotifications({ eventsBot, models }: Providers) {
  // Handle New Event notifications
  eventsBot.on("guildScheduledEventCreate", (event) => {
    if (!event.isScheduled()) {
      return;
    }
    notifyNewEvent(event, models.user);
  });

  const notifySubscribers = async (eventWindow: EventWindow) => {
    const subscribers = await models.user.fetchPreNotificationSubscribers();

    const recipients = subscribers
      .filter((sub) => {
        return (
          sub.pre_notification > eventWindow.minTime &&
          sub.pre_notification < eventWindow.maxTime
        );
      })
      .map((sub) => sub.discord_id);

    if (!recipients.length) {
      return;
    }

    const content = `Happening soon: ${eventWindow.event.name}\n\nThere is an event in the Off-Nominal Discord happening soon!\n\nYou are receiving this DM because you subscribed via the \`/events\` command. If you want to change this, you can update your settings with \`/events subscribe\` or \`/events unsubscribe\` (note: This must be done in the server and not via DM.)`;
    const embed = createEventAnnouncementEmbed(eventWindow.event, "pre");

    recipients.forEach(async (recipient) => {
      const logger = new Logger(
        "EventNotifications",
        LogInitiator.DISCORD,
        "Send DMs for Pre-Notification"
      );

      let user: GuildMember;

      try {
        user = await eventWindow.event.guild.members.fetch(recipient);
      } catch (err) {
        console.error(err);
        logger.addLog(LogStatus.FAILURE, "Failed to fetch User");
        logger.sendLog(eventsBot);
        return;
      }

      let dmChannel: DMChannel;

      try {
        dmChannel = await user.createDM();
      } catch (err) {
        console.error(err);
        logger.addLog(LogStatus.FAILURE, "Failed to create DM Channel");
        logger.sendLog(eventsBot);
        return;
      }

      try {
        await dmChannel.send({ content, embeds: [embed] });
      } catch (err) {
        console.error(err);
        logger.addLog(LogStatus.FAILURE, "Failed to send DM");
        logger.sendLog(eventsBot);
        return;
      }
    });
  };

  // Handle pre-event notifications based on user settings
  monitorEvents(eventsBot, notifySubscribers);

  // Handle subscriptions
  eventsBot.on("interactionCreate", (interaction) => {
    setSubscriptions(interaction, models.user);
  });
}
