import { Client, Message } from 'discord.js';
const { onbPrefix } = require('../../../config/discord.json');
import { parseMessage } from '../../helpers/parseMessage';
import { testNewUser } from './commands/testNewUser';

export const handleMessage = (client: Client, message: Message) => {
  if (!message.content.startsWith(onbPrefix) || message.author.bot) return;
  const { command } = parseMessage(onbPrefix, message);

  if (command === `test`) {
    testNewUser(client, message);
  }
};
