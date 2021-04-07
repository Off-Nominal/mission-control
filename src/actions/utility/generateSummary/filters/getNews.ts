import { Collection, Message } from "discord.js";

// Fetches URLs in messages and removes any from blacklisted domains.
// Hope is to remove Twitter Links, Podcast Links, and other non-news content
// Only looks for content with embeds to provide a minimum level of quality

export const getNews = (
  messages: Collection<string, Message>
): Collection<string, Message> => {
  return messages.filter((msg) => {
    const lcMsg = msg.content.toLowerCase();

    const notABot = !msg.author.bot;

    const isNotNews =
      lcMsg.includes("twitter.com") || // Twitter Links are aggregated separately
      lcMsg.includes("wemartians.com") || // All Off-Nom content is already summarized in #content channel
      lcMsg.includes("offnom.com") ||
      lcMsg.includes("offnominal.space") ||
      lcMsg.includes("mainenginecutoff.com") ||
      lcMsg.includes("patreon.com/posts/");

    const isNews = !isNotNews;

    const hasEmbeds = msg.embeds.length > 0;

    return isNews && hasEmbeds && notABot;
  });
};
