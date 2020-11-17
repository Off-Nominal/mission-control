import { Message } from 'discord.js';

require('dotenv').config();
const Discord = require('discord.js');
const { prefix } = require('./config.json');
import { handleRecommendCommand } from './commands/recommend';

const client = new Discord.Client();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', (message: Message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === `recommend`) {
    handleRecommendCommand(args[0], message);
  }
});

client.login(process.env.DISCORD_TOKEN_ID);
