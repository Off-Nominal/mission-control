import { Message } from 'discord.js';

export const parseMessage = (
  prefix: string,
  message: Message
): { args: string[]; command: string } => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  return { args, command };
};
