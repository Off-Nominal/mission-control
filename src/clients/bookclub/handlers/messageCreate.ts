import { Message } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";

enum AllowedPrefix {
  BC = "!bc",
}

export default async function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const [prefix] = parseCommands(message);
  if (!Object.values(AllowedPrefix).includes(prefix as AllowedPrefix)) return;

  message.channel.send({
    content:
      "The Book Club Bot no longer accepts text-initiated commands. Start typing `/bookclub` to access the built-in slash commands.",
  });
}
