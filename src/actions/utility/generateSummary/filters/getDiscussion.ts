import { Collection, Message } from "discord.js";

// Fetches user generated content only

export const getDiscussion = (
  messages: Collection<string, Message>
): Collection<string, Message> => {
  return messages.filter((msg) => {
    if (!msg.content || msg.author.bot) {
      return false;
    }

    return true;
  });
};
