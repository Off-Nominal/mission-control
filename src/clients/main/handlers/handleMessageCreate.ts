import { Message } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";
import {
  findTempsToConvert,
  createTempConversionEmbed,
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
  OLD_PODCASTS = "!podcasts",
  OLD_TOPIC = "!topic",
}

export default async function handleMessageCreate(message: Message) {
  //Checks for Temperatures to Convert
  const temperaturesToConvert = findTempsToConvert(message);
  if (temperaturesToConvert.length) {
    const embeds = [createTempConversionEmbed(temperaturesToConvert)];
    try {
      await message.channel.send({ embeds });
    } catch (err) {
      console.error(err);
    }
  }

  if (message.author.bot) return;

  const [prefix] = parseCommands(message);

  // for testing connection to db
  if (process.env.NODE_ENV === "dev") {
    if (prefix === "!dbtest") {
      this.emit("dev_dbtest");
    }

    if (prefix === "!senddelinquents") {
      this.emit("dev_sendDelinquents");
    }
  }

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

    case AllowedPrefix.OLD_PODCASTS:
    case AllowedPrefix.OLD_WM:
    case AllowedPrefix.OLD_HL:
    case AllowedPrefix.OLD_RPR:
    case AllowedPrefix.OLD_MECO:
    case AllowedPrefix.OLD_OFN: {
      message.channel.send(
        "The podcast bots have been replaced by one Content Bot to rule them all. Type `/content` to access the new slash commands and use `/content help` for more info."
      );
      break;
    }

    case AllowedPrefix.OLD_TOPIC: {
      message.channel.send(
        "The !topic command has been deprecated. Try the new `/events start` command to use Discord's built in event feature."
      );
      break;
    }
  }
}
