import { Message } from "discord.js";
import { parseCommands } from "../../../helpers/parseCommands";
import { DevEvents } from "../../../types/eventEnums";

export default function handleMessageCreate(message: Message) {
  if (message.author.bot) return;

  const [prefix, show] = parseCommands(message);

  if (prefix === "!content") {
    message.client.emit(DevEvents.NEW_ENTRIES, show);
  }

  if (prefix === "!threaddigest") {
    message.client.emit(DevEvents.THREAD_DIGEST_SEND);
  }
}
