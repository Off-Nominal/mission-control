import { Message } from 'discord.js';
const { bcbPrefix } = require('../../../config/discord.json');
import { parseMessage } from '../../helpers/parseMessage';
import { handleRecommendCommand } from './commands/recommend';
import { handleHelpCommand } from './commands/help';

export const handleMessage = (message: Message) => {
  if (!message.content.startsWith(bcbPrefix) || message.author.bot) return;

  const { args, command } = parseMessage(bcbPrefix, message);

  if (command === `recommend`) {
    handleRecommendCommand(args[0], message);
  } else if (command === 'help') {
    handleHelpCommand(message);
  }
};
