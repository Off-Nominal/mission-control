import {
  Client,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
} from "discord.js";
import fetchGuild from "../helpers/fetchGuild";

const MS_IN_A_SEC = 1000;
const SEC_IN_AN_MIN = 60;

export type EventWindow = {
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>;
  minTime: number;
  maxTime: number;
};

export function monitorEvents(
  client: Client,
  callback: (eventWindow: EventWindow) => void
) {
  setInterval(async () => {
    const guild = fetchGuild(client);
    if (!guild) return;

    const events = await guild.scheduledEvents.fetch();

    events.forEach((event) => {
      if (!event.isScheduled() || !event.scheduledStartAt) {
        return;
      }

      const eventStartTimeStamp = event.scheduledStartAt.getTime();
      const now = Date.now();

      const maxTime = (eventStartTimeStamp - now) / MS_IN_A_SEC / SEC_IN_AN_MIN;
      const minTime = maxTime - 5;

      callback({
        event,
        minTime,
        maxTime,
      });
    });
  }, 5 * SEC_IN_AN_MIN * MS_IN_A_SEC);
}
