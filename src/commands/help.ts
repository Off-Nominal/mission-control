import { Message } from 'discord.js';

export const handleHelpCommand = (message: Message) => {
  message.channel.send('hi, i can haz help');
};
