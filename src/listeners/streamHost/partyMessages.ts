import { GuildScheduledEvent } from "discord.js";

export type PartyMessages = {
  text: string;
  waitTime: number;
};

export const generatePartyMessages = (
  event: GuildScheduledEvent<"ACTIVE">
): PartyMessages[] => {
  const standardMessages = [
    {
      text: `Welcome to the stream for ${event.name}! I'll be your host for this event. Let's see if we can't spice things up a little today!`,
      waitTime: 0,
    },
    {
      text: "Over under on these guys getting started on time?",
      waitTime: 0.1,
    },
  ];

  const randomMessages = [
    "Is there something on Jake's shirt?",
    "Oh dear, this one's going off the rails, isn't it...",
    "Wait what did he just say?",
    "Omg",
    "brb, I'm going to get another beer",
    "I love hanging out with y'all!",
  ];

  const chosenMessages = randomMessages.filter((msg) => Math.random() > 0.5);

  const timedChosenMessages = chosenMessages.map((msg) => {
    return {
      text: msg,
      waitTime: Math.random() * 50 + 5, // 5-55 minutes
    };
  });

  return [...standardMessages, ...timedChosenMessages];
};
