require('dotenv').config();
const Discord = require('discord.js');
import { Client, Message } from 'discord.js';
import onbListeners from './onbListeners/';
import utilityListeners from './utilityListeners/';
import bcbListeners from './bcbListeners';

/***********************************
 *  Off-Nominal Bot
 ************************************/

const offNomBot: Client = new Discord.Client();

offNomBot.once('ready', () => utilityListeners.logReady(offNomBot.user.tag));
offNomBot.on('message', (message: Message) =>
  onbListeners.handleMessage(offNomBot, message)
);
offNomBot.on('guildMemberAdd', onbListeners.welcomeUser);

offNomBot.login(process.env.OFFNOM_BOT_TOKEN_ID);

/***********************************
 *  Book Club Bot
 ************************************/

const bookClubBot: Client = new Discord.Client();

bookClubBot.once('ready', () =>
  utilityListeners.logReady(bookClubBot.user.tag)
);
bookClubBot.on('message', bcbListeners.handleMessage);

bookClubBot.login(process.env.BOOK_CLUB_BOT_TOKEN_ID);
