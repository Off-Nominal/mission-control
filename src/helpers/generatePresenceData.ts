import { PresenceData } from "discord.js";

export const generatePresenceData = (helpCommand: string): PresenceData => {
  return {
    status: "online",
    activities: [
      {
        name: helpCommand,
        type: "PLAYING",
      },
    ],
  };
};
