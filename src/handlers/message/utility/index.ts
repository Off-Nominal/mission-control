import { Message } from "discord.js";
import { createPoll } from "../../../actions/utility/createPoll";
import { generateSummary } from "../../../actions/utility/generateSummary/generateSummary";
import { sendHelp } from "../../../actions/utility/sendHelp";
import { sendPodcastHelp } from "../../../actions/utility/sendPodcastHelp";
import { sendSummaryHelp } from "../../../actions/utility/sendSummaryHelp";
import { shunt } from "../../../actions/utility/shunt";
import { parseCommands } from "../../../helpers/parseCommands";

enum AllowedPrefix {
  SHUNT = "!shunt",
  HELP = "!help",
  OLDPOLL = "+poll",
  POLL = "!poll",
  SUMMARY = "!summary",
}

export const handleMessage = (message: Message) => {
  if (message.author.bot) return;

  const [prefix, command, secondCommand, ...rest] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  switch (prefix) {
    case AllowedPrefix.SHUNT: {
      if (command === "help") {
        sendHelp(message);
      } else {
        shunt(message);
      }
      break;
    }
    case AllowedPrefix.HELP: {
      if (command === "podcast" || command === "podcasts") {
        sendPodcastHelp(message);
      } else {
        sendHelp(message);
      }
      break;
    }
    case AllowedPrefix.OLDPOLL:
      message.channel.send(
        "Please note the syntax for Polling has changed from `+poll` to `!poll` to match other bots. Type `!poll help` for more."
      );
    case AllowedPrefix.POLL: {
      createPoll(message);
      break;
    }
    case AllowedPrefix.SUMMARY: {
      const numberfiedCommand = Number(command);

      if (command === "help") {
        sendSummaryHelp(message);
      } else if (!isNaN(numberfiedCommand)) {
        const forceChannel = secondCommand === "channel";
        generateSummary(message, numberfiedCommand, forceChannel);
      } else {
        generateSummary(message);
      }
      break;
    }
  }
};

export default handleMessage;
