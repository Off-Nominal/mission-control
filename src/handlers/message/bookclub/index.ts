import { Message } from "discord.js";
import { handleHelpCommand } from "../../../actions/bookClub/help";
import { handleRecommendCommand } from "../../../actions/bookClub/recommend";
import { parseCommands } from "../../../helpers/parseCommands";

enum AllowedPrefix {
  SHUNT = "!bc",
}

export const handleMessage = (message: Message) => {
  if (message.author.bot) return;

  const [prefix, command, ...rest] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  if (command === `recommend`) {
    const recoomendType = rest[0];
    handleRecommendCommand(recoomendType, message);
  } else if (command === "help") {
    handleHelpCommand(message);
  }
};

export default handleMessage;
