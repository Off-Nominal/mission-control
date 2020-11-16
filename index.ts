require('dotenv').config();
const Discord = require('discord.js');

const client = new Discord.Client();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', (message) => {
  if (message.content === `!bc`) console.log(message.content, 'yo');
});

client.login(process.env.DISCORD_TOKEN_ID);
