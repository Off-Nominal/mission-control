import { Client, Message } from 'discord.js';

export const testNewUser = (client: Client, message: Message) => {
  client.emit('guildMemberAdd', message.member);
};
