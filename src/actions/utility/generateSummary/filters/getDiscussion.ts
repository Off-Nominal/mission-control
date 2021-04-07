import { Collection, Message } from "discord.js";

// Fetches user generated content only

export const getDiscussion = (
  messages: Collection<string, Message>
): Collection<string, Message> => {
  return messages.filter((msg) => {
    const hasContent = !!msg.content;
    const isNotABot = !msg.author.bot;
    const isNotABotCall = !msg.content.startsWith("!");

    return hasContent && isNotABot && isNotABotCall;
  });
};
