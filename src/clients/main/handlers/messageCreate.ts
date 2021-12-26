import { Message, TextChannel } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";
import { ReportGenerator } from "../../../utilities/ReportGenerator";
import { createPodcastHelpEmbed } from "../../actions/createPodcastHelpEmbed";
import { createPoll } from "../actions/createPoll";
import { marsTime } from "../actions/marstime/marsTime";
import { generateHelpEmbed } from "../actions/generateHelpEmbed";
import {
  findTempsToConvert,
  sendTemperatureConversions,
} from "../actions/translateTemp";

export enum AllowedPrefix {
  SHUNT = "!shunt",
  HELP = "!help",
  OLDPOLL = "+poll",
  POLL = "!poll",
  SUMMARY = "!summary",
  MARSTIME = "!marstime",
  THREAD = "!thread",
}

export default async function handleMessageCreate(
  message: Message,
  reportGenerator: ReportGenerator
) {
  //Checks for Temperatures to Convert
  const temperaturesToConvert = findTempsToConvert(message);
  if (temperaturesToConvert.length) {
    await sendTemperatureConversions(message, temperaturesToConvert);
  }

  if (message.author.bot) return;

  const [prefix, command, secondCommand, ...rest] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  switch (prefix) {
    case AllowedPrefix.THREAD: {
      message.channel.send(
        "The `!thread` command is deprecated. You can use Discord's built in `/thread` command to make a thread right here in the same channel, or use the `/shunt` command to go to another channel (just add `thread: true` at the end of your command)."
      );
      break;
    }
    case AllowedPrefix.SHUNT: {
      message.channel.send(
        "Shunt no longer accepts text initiated commands. Use the new slash commands by typing `/shunt` and following the auto complete prompts."
      );
      break;
    }

    case AllowedPrefix.MARSTIME: {
      marsTime(message, command, secondCommand);
      break;
    }

    case AllowedPrefix.HELP: {
      if (command === "podcast" || command === "podcasts") {
        message.channel.send({ embeds: [createPodcastHelpEmbed()] });
      } else {
        message.channel.send({ embeds: [generateHelpEmbed()] });
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
}
