import { Message, TextChannel } from "discord.js";
import { createPoll } from "../../../actions/utility/createPoll";
import { sendHelp } from "../../../actions/utility/sendHelp";
import { sendPodcastHelp } from "../../../actions/utility/sendPodcastHelp";
import { shunt } from "../../../actions/utility/shunt";
import { parseCommands } from "../../../helpers/parseCommands";
import { ReportGenerator } from "../../../utilities/ReportGenerator";

enum AllowedPrefix {
  SHUNT = "!shunt",
  HELP = "!help",
  OLDPOLL = "+poll",
  POLL = "!poll",
  SUMMARY = "!summary",
}

export const handleMessage = async (
  message: Message,
  reportGenerator: ReportGenerator
) => {
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
      if (command === "help") {
        reportGenerator.sendHelp(message);
      } else if (message.guild === null) {
        reportGenerator.sendError(message, "dm");
      } else {
        const forceChannel = command === "here" || secondCommand === "here";
        const timeLimit = Number(command) || 8;
        const channel = forceChannel
          ? (message.channel as TextChannel)
          : await message.author.createDM();

        const reportId = await reportGenerator.generateReport(
          message,
          timeLimit,
          forceChannel
        );
        reportGenerator.sendReport(
          channel,
          reportId,
          forceChannel ? "channel" : "dm"
        );
      }
      break;
    }
  }
};

export default handleMessage;
