require('dotenv').config();
const Discord = require('discord.js');
const { prefix } = require('../config/discord.json');
import { Client, GuildMember, Message } from 'discord.js';
import { handleHelpCommand } from './commands/help';
import { welcomeMember } from './welcome/welcome';
import { handleRecommendCommand } from './commands/recommend';
import { parseMessage } from './utility/parseMessage';

/***********************************
 *  Off-Nominal Bot
 ************************************/

const offNomBot: Client = new Discord.Client();

offNomBot.once('ready', () => {
  console.log(`Logged in as ${offNomBot.user.tag}`);
});

offNomBot.on('guildMemberAdd', async (member: GuildMember) => {
  welcomeMember(member);
});

offNomBot.login(process.env.OFFNOM_BOT_TOKEN_ID);

/***********************************
 *  Book Club Bot
 ************************************/

const bookClubBot: Client = new Discord.Client();

bookClubBot.once('ready', () => {
  console.log(`Logged in as ${bookClubBot.user.tag}`);
});

bookClubBot.on('message', (message: Message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const { args, command } = parseMessage(message);

  if (command === `recommend`) {
    handleRecommendCommand(args[0], message);
  } else if (command === 'help') {
    handleHelpCommand(message);
  }
});

bookClubBot.login(process.env.BOOK_CLUB_BOT_TOKEN_ID);
