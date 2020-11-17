import { Message } from 'discord.js';

require('dotenv').config();
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const axios = require('axios');

const client = new Discord.Client();
const BASEURL = process.env.BASEURL;

enum RecommendCommand {
  random = 'random',
  highestrated = 'highestrate',
  favourite = 'favourite',
}

enum ErrorType {
  api = 'api',
  badCommand = 'bad-command',
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', (message: Message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === `recommend`) {
    const sendError = (type: ErrorType, incorrectArg?: string) => {
      let errorMessage;
      switch (type) {
        case 'api':
          errorMessage = 'Oh no, something seems to have gone wrong.';
          break;
        case 'bad-command':
          errorMessage = `That recommend type (${incorrectArg}) is not supported`;
      }
      message.channel.send(errorMessage);
    };

    const sendRecommendation = (slug) => {
      message.channel.send(`${BASEURL}/books/${slug}`);
    };

    const handleRecommendCommand = (type: RecommendCommand) => {
      axios
        .get(`${BASEURL}/api/recommendations?type=${type}`)
        .then((response) => sendRecommendation(response.data[0].slug))
        .catch((err) => {
          console.error(err);
          sendError(ErrorType.api);
        });
    };

    switch (args[0]) {
      case 'random':
        handleRecommendCommand(RecommendCommand.random);
        break;
      case 'best':
        axios;
        handleRecommendCommand(RecommendCommand.highestrated);
        break;
      case 'favourite':
        handleRecommendCommand(RecommendCommand.favourite);
        break;
      default:
        sendError(ErrorType.badCommand, args[0]);
    }
  }
});

client.login(process.env.DISCORD_TOKEN_ID);
