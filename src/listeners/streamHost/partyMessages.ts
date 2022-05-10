import { GuildScheduledEvent } from "discord.js";

export type PartyMessages = {
  [key: string]: string;
};

export const generatePartyMessages = (
  event: GuildScheduledEvent<"ACTIVE">
): PartyMessages => {
  return {
    welcome: `Welcome to the stream for ${event.name}! I'll be your host for this event.`,
  };
};
