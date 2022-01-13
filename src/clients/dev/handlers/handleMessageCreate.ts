import { Message } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";

export default function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const [prefix, arg1] = parseCommands(message);

  if (prefix === "!content") {
    message.client.emit("dev_new entries", arg1);
  }
}
