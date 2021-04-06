import { Message } from "discord.js";
import { handleHelpCommand } from "../../../actions/bookClub/help";
import { handleRecommendCommand } from "../../../actions/bookClub/recommend";
import { sendError } from "../../../actions/global/sendError";
import { parseCommands } from "../../../helpers/parseCommands";

enum AllowedPrefix {
  SHUNT = "!bc",
}

export const handleMessage = (message: Message) => {
  if (message.author.bot) return;

  const [prefix, command, ...rest] = parseCommands(message);

  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  if (command === `recommend`) {
    const recommendType = rest[0];
    handleRecommendCommand(recommendType, message);
  } else if (command === "help") {
    handleHelpCommand(message);
  } else {
    sendError(message, "bc");
  }
};

export default handleMessage;
