import { Message } from "discord.js";

export const sendError = (message: Message, prefix?: string) => {
  message.channel.send(
    `Command not recognized. If you're stuck, try \`!${
      prefix && prefix + " "
    }help\` to find your way.`
  );
};
