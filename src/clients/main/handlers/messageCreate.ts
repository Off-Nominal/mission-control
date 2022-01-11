import { Message } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";
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
  OLD_WM = "!wm",
  OLD_MECO = "!meco",
  OLD_OFN = "!ofn",
  OLD_HL = "!hl",
  OLD_RPR = "!rpr",
}

export default async function handleMessageCreate(message: Message) {
  //Checks for Temperatures to Convert
  const temperaturesToConvert = findTempsToConvert(message);
  if (temperaturesToConvert.length) {
    await sendTemperatureConversions(message, temperaturesToConvert);
  }

  if (message.author.bot) return;

  const [prefix] = parseCommands(message);

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
      message.channel.send(
        "`!marstime` no longer accepts text initiated commands. Use the new slash commands by typing `/marstime` and selecting your spacecraft."
      );
      break;
    }

    case AllowedPrefix.HELP: {
      message.channel.send("The `!help` command has been moved to `/help`.");
      break;
    }

    // OLDPOLL cascades into POLL to handle old syntax
    case AllowedPrefix.OLDPOLL:
    case AllowedPrefix.POLL: {
      message.channel.send({
        content:
          "Both `+poll` and `!poll` have moved to the new slash command format. Try calling one with `/poll ask` or call `/poll help` for more infor.",
      });
      break;
    }

    case AllowedPrefix.SUMMARY: {
      message.channel.send(
        "`!summary` no longer accepts text initiated commands. Use the new slash commands by typing `/summary` and selecting your time window."
      );
      break;
    }

    case AllowedPrefix.OLD_WM:
    case AllowedPrefix.OLD_HL:
    case AllowedPrefix.OLD_RPR:
    case AllowedPrefix.OLD_MECO:
    case AllowedPrefix.OLD_OFN: {
      message.channel.send(
        "The podcast bots no longer reply to text-initiated message. Type `/podcasts` to access the new slash commands and use `/podcast help` for more info."
      );
      break;
    }
  }
}
