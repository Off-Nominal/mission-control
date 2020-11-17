import { Message } from 'discord.js';
const axios = require('axios');

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

export const handleRecommendCommand = (arg: string, message: Message) => {
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

  const handleCommand = (type: RecommendCommand) => {
    axios
      .get(`${BASEURL}/api/recommendations?type=${type}`)
      .then((response) => sendRecommendation(response.data[0].slug))
      .catch((err) => {
        console.error(err);
        sendError(ErrorType.api);
      });
  };

  switch (arg) {
    case 'random':
      handleCommand(RecommendCommand.random);
      break;
    case 'best':
      axios;
      handleCommand(RecommendCommand.highestrated);
      break;
    case 'favourite':
      handleCommand(RecommendCommand.favourite);
      break;
    default:
      sendError(ErrorType.badCommand, arg);
  }
};
