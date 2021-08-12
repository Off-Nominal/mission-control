import { Message, TextChannel } from "discord.js";
import { createPoll } from "../../../actions/utility/createPoll";
import { marsTime } from "../../../actions/utility/marstime/marsTime";
import { sendHelp } from "../../../actions/utility/sendHelp";
import { sendPodcastHelp } from "../../../actions/utility/sendPodcastHelp";
import { shunt } from "../../../actions/utility/shunt";
import {
  findTempsToConvert,
  sendTemperatureConversions,
} from "../../../actions/utility/translateTemp";
import { parseCommands } from "../../../helpers/parseCommands";
import { ReportGenerator } from "../../../utilities/ReportGenerator";

export enum AllowedPrefix {
  SHUNT = "!shunt",
  HELP = "!help",
  OLDPOLL = "+poll",
  POLL = "!poll",
  SUMMARY = "!summary",
  MARSTIME = "!marstime",
  THREAD = "!thread",
}

export const handleMessage = async (
  message: Message,
  reportGenerator: ReportGenerator
) => {
  //Checks for Temperatures to Convert
  const temperaturesToConvert = findTempsToConvert(message);
  if (temperaturesToConvert.length) {
    await sendTemperatureConversions(message, temperaturesToConvert);
  }

  if (message.author.bot) return;

  const [prefix, command, secondCommand, ...rest] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  switch (prefix) {
    case AllowedPrefix.THREAD:
    case AllowedPrefix.SHUNT: {
      if (command === "help") {
        sendHelp(message);
      } else {
        shunt(message, prefix);
      }
      break;
    }

    case AllowedPrefix.MARSTIME: {
      marsTime(message, command, secondCommand);
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

    // OLDPOLL cascades into POLL to handle old syntax
    case AllowedPrefix.OLDPOLL:
      message.channel.send({
        content:
          "Please note the syntax for Polling has changed from `+poll` to `!poll` to match other bots. Type `!poll help` for more.",
      });
    case AllowedPrefix.POLL: {
      createPoll(message);
      break;
    }

    case AllowedPrefix.SUMMARY: {
      if (command === "help") {
        reportGenerator.sendHelp(message);
        break;
      }

      // This is a report request DM, which report generator does not support
      if (message.guild === null) {
        reportGenerator.sendError(
          message,
          "My summary function doesn't work great via DM. Try calling me from a channel!"
        );
        break;
      }

      const forceChannel = command === "here" || secondCommand === "here";
      const timeLimit = Number(command) || 8;

      try {
        const channel = forceChannel
          ? (message.channel as TextChannel)
          : await message.author.createDM();

        const reportId = await reportGenerator.generateReport(
          message,
          timeLimit,
          forceChannel
        );

        await reportGenerator.sendReport(channel, reportId);
      } catch (err) {
        console.error(err);
      }

      break;
    }
  }
};

export default handleMessage;
