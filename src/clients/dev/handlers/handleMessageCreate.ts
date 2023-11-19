import { Message } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";
import { DevEvents } from "../../../types/eventEnums";

export default function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const [prefix, show] = parseCommands(message);

  if (prefix === "!content") {
    if (!show) {
      message.reply({
        content: "Please add a show title as an argument",
      });
      return;
    }
    message.client.emit(DevEvents.NEW_ENTRIES, show);
  }
}
