import { Message } from "discord.js";
import { handleHelpCommand } from "../actions/help";
import { handleRecommendCommand } from "../actions/recommend";
import { sendError } from "../../../actions/global/sendError";
import { parseCommands } from "../../../helpers/parseCommands";

enum AllowedPrefix {
  BC = "!bc",
}

export default function handleMessageCreate(message: Message) {
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
}
