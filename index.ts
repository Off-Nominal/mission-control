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
        message.channel.send('here is a random book');
        break;
      case 'best':
        message.channel.send('here is the highest rated book');
        break;
      case 'favourite':
        message.channel.send('here is the most liked book');
        break;
      default:
        console.log('some other command', args);
    }
  }
});

client.login(process.env.DISCORD_TOKEN_ID);
