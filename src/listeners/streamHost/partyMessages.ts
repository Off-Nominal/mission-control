import { GuildScheduledEvent } from "discord.js";

export type PartyMessages = {
  [key: string]: {
    text: string;
    waitTime: number;
  };
};

export const generatePartyMessages = (
  event: GuildScheduledEvent<"ACTIVE">
): PartyMessages => {
  return {
    welcome: {
      text: `Welcome to the stream for ${event.name}! I'll be your host for this event.`,
      waitTime: 0,
    },
  };
};
