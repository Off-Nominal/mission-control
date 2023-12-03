import { GuildScheduledEvent } from "discord.js";

export const getRllIdFromText = (text: string): number | null => {
  const rllId = text.match(new RegExp(/(?<=\[)(.*?)(?=\])/gm));

  if (rllId?.length) {
    return parseInt(rllId[0]);
  } else {
    return null;
  }
};

export const getRllIdFromEvent = (
  event: GuildScheduledEvent
): number | null => {
  if (!event.description) return null;

  return getRllIdFromText(event.description);
};
