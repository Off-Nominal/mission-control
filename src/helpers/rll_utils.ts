import { GuildScheduledEvent, GuildScheduledEventStatus } from "discord.js";

export const getRLLMetadataFromText = (
  text: string,
  key: "rllId" | "providerId" | "country"
): string | null => {
  let data: RegExpMatchArray | null = null;

  if (key === "rllId") {
    data = text.match(new RegExp(/(?<=rllId=\[)(.*?)(?=\])/gm));
  } else if (key === "providerId") {
    data = text.match(new RegExp(/(?<=providerId=\[)(.*?)(?=\])/gm));
  } else if (key === "country") {
    data = text.match(new RegExp(/(?<=country=\[)(.*?)(?=\])/gm));
  }

  if (data?.length) {
    return data[0];
  } else {
    return null;
  }
};

export const getRllIdFromEvent = (
  event: GuildScheduledEvent
): number | null => {
  if (!event.description) return null;

  const id = getRLLMetadataFromText(event.description, "rllId");

  return id === null ? null : parseInt(id);
};

export const getCountryFromEvent = (
  event: GuildScheduledEvent
): string | null => {
  if (!event.description) return null;

  return getRLLMetadataFromText(event.description, "country");
};

export const getProviderIdFromEvent = (
  event: GuildScheduledEvent
): number | null => {
  if (!event.description) return null;

  const id = getRLLMetadataFromText(event.description, "providerId");
  return id === null ? null : parseInt(id);
};

const SPACEX_PROVIDER_ID = 1;

export const isSpaceX = (providerId: number | null): boolean =>
  providerId === SPACEX_PROVIDER_ID;

export const eventNameIncludes = (
  event: GuildScheduledEvent<GuildScheduledEventStatus.Scheduled>,
  text: string
): boolean => {
  return event.name.toLowerCase().includes(text.toLowerCase());
};
