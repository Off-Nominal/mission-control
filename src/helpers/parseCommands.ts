import { Message } from "discord.js";

export const parseCommands = (
  message: Message,
  lowerCase: boolean = true
): string[] => {
  const stringMsg = message.content.trim();

  const formattedMsg = lowerCase ? stringMsg.toLowerCase() : stringMsg;

  return formattedMsg.split(" ");
};
