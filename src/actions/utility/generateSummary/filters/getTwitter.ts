import { Collection, Message } from "discord.js";

// Fetches all messages that post a twitter link

export const getTwitter = (
  messages: Collection<string, Message>
): Collection<string, Message> => {
  return messages.filter((msg) => {
    const lcMsg = msg.content.toLowerCase();

    const isTwitterLink = lcMsg.includes("//twitter.com");

    return !isTwitterLink;
  });
};
