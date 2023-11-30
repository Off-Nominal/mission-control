import { Collection, Message } from "discord.js";

// Fetches YouTube Links

export const getYouTube = (
  messages: Collection<string, Message>
): Collection<string, Message> => {
  const filteredMessages = messages.filter((msg) => {
    const lcMsg = msg.content.toLowerCase();

    const isYouTubeLink =
      lcMsg.includes("youtu.be") || lcMsg.includes("youtube.com/watch");

    return isYouTubeLink;
  });
  return filteredMessages;
};
