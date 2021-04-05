import { Message } from "discord.js";

export const parseCommands = (message: Message): string[] => {
  return message.content.trim().toLowerCase().split(" ");
};
