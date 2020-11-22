import { Message } from 'discord.js';
const { prefix } = require('../../config/discord.json');

export const parseMessage = (
  message: Message
): { args: string[]; command: string } => {
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  return { args, command };
};
