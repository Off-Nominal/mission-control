import { Message, TextChannel } from "discord.js";

export const getChannel = (
  message: Message,
  channelString: string
): TextChannel => {
  if (channelString.startsWith("<#")) {
    const channelId = channelString.slice(2, channelString.length - 1);
    return message.guild.channels.cache.find(
      (ch) => ch.id === channelId
    ) as TextChannel;
  } else {
    return message.guild.channels.cache.find(
      (ch) => ch.name === channelString
    ) as TextChannel;
  }
};
