import { parseCommands } from "../../helpers/parseCommands";
import { Providers } from "../../providers";

export default function WarnDeprecatedCommands({ helperBot }: Providers) {
  helperBot.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const [prefix] = parseCommands(message);

    switch (prefix) {
      case "!thread": {
        message.channel.send(
          "The `!thread` command is deprecated. You can use Discord's built in `/thread` command to make a thread right here in the same channel, or use the `/shunt` command to go to another channel (just add `thread: true` at the end of your command)."
        );
        break;
      }
      case "!shunt": {
        message.channel.send(
          "Shunt no longer accepts text initiated commands. Use the new slash commands by typing `/shunt` and following the auto complete prompts."
        );
        break;
      }

      case "!marstime": {
        message.channel.send(
          "`!marstime` no longer accepts text initiated commands. Use the new slash commands by typing `/marstime` and selecting your spacecraft."
        );
        break;
      }

      case "!help": {
        message.channel.send("The `!help` command has been moved to `/help`.");
        break;
      }

      // OLDPOLL cascades into POLL to handle old syntax
      case "+poll":
      case "!poll": {
        message.channel.send({
          content:
            "Both `+poll` and `!poll` have moved to the new slash command format. Try calling one with `/poll ask` or call `/poll help` for more infor.",
        });
        break;
      }

      case "!summary": {
        message.channel.send(
          "`!summary` no longer accepts text initiated commands. Use the new slash commands by typing `/summary` and selecting your time window."
        );
        break;
      }

      case "!podcasts":
      case "!wm":
      case "!hl":
      case "!rpr":
      case "!meco":
      case "!ofn": {
        message.channel.send(
          "The podcast bots have been replaced by one Content Bot to rule them all. Type `/content` to access the new slash commands and use `/content help` for more info."
        );
        break;
      }

      case "!topic": {
        message.channel.send(
          "The !topic command has been deprecated. Try the new `/events start` command to use Discord's built in event feature."
        );
        break;
      }
    }
  });
}
