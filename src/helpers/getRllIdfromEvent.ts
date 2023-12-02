import { GuildScheduledEvent } from "discord.js";

export const getRllIdFromEvent = (
  event: GuildScheduledEvent
): number | null => {
  if (!event.description) return null;

  const rllId = event.description.match(new RegExp(/(?<=\[)(.*?)(?=\])/gm));

  if (rllId?.length) {
    return parseInt(rllId[0]);
  }
};
