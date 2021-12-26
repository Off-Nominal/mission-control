import { Message } from "discord.js";

export default function handleMessageCreate(message: Message, prefix: string) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  message.channel.send(
    "The podcast bots no longer reply to text-initiated message. Type `/podcasts` to access the new slash commands and use `/podcast help` for more info."
  );
}
