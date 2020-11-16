require('dotenv').config();
const Discord = require('discord.js');
const axios = require('axios');
const { prefix } = require('./config.json');

const client = new Discord.Client();
const BASEURL = process.env.BASEURL;

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === `recommend`) {
    switch (args[0]) {
      case 'random':
        console.log('random', args);
        break;
      case 'best':
        console.log('highest rated', args);
        break;
      case 'favourite':
        console.log('favourite', args);
        break;
      default:
        console.log('some other command', args);
    }
  }
});

client.login(process.env.DISCORD_TOKEN_ID);
