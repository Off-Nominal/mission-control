import { Message } from "discord.js";
import { shunt } from "../../actions/utility/shunt";
import { parseCommands } from "../../helpers/parseCommands";

enum AllowedPrefix {
  SHUNT = "!shunt",
}

export const handleMessage = (message: Message) => {
  if (message.author.bot) return;

  const [prefix, ...rest] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  switch (prefix) {
    case AllowedPrefix.SHUNT: {
      shunt(message);
      break;
    }
  }
};

export default handleMessage;
