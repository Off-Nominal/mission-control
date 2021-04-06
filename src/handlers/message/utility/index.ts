import { Message } from "discord.js";
import { createPoll } from "../../../actions/utility/createPoll";
import { sendHelp } from "../../../actions/utility/sendHelp";
import { sendPodcastHelp } from "../../../actions/utility/sendPodcastHelp";
import { shunt } from "../../../actions/utility/shunt";
import { parseCommands } from "../../../helpers/parseCommands";

enum AllowedPrefix {
  SHUNT = "!shunt",
  HELP = "!help",
  POLL = "!poll",
}

export const handleMessage = (message: Message) => {
  if (message.author.bot) return;

  const [prefix, command, ...rest] = parseCommands(message);

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
    case AllowedPrefix.POLL: {
      createPoll(message);
      break;
    }
  }
};

export default handleMessage;
