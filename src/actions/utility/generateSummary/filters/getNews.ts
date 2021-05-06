import { Collection, Message } from "discord.js";

// Fetches URLs in messages and removes any from blacklisted domains.
// Hope is to remove Twitter Links, Podcast Links, and other non-news content
// Only looks for content with embeds to provide a minimum level of quality

export const getNews = (
  messages: Collection<string, Message>
): Collection<string, Message> => {
  const filteredMessages = messages.filter((msg) => {
    const lcMsg = msg.content.toLowerCase();

    const isNotNews =
      lcMsg.includes("twitter.com") || // Twitter Links are aggregated separately
      lcMsg.includes("youtube.com") || // YouTube Links are aggregated separately
      lcMsg.includes("youtu.be") ||
      lcMsg.includes("tenor.com") || // Tenor hosts Discord gifs and should be excluded
      lcMsg.includes("i.redd.it") || // Reddit images are not articles
      lcMsg.includes("i.imgur.com"); // Imgur images are not articles. Albums and photo links do have embed though and are counted.
    lcMsg.includes("discord.com/channels/") || // Links to other Discord messages
      lcMsg.includes("wemartians.com") || // All Off-Nom content is already summarized in #content channel
      lcMsg.includes("offnom.com") ||
      lcMsg.includes("offnominal.space") ||
      lcMsg.includes("mainenginecutoff.com") ||
      lcMsg.includes("patreon.com/posts/");

    const isNews = !isNotNews;
    const hasEmbeds = msg.embeds.length;
    const notABot = !msg.author.bot;

    return isNews && hasEmbeds && notABot;
  });
  return filteredMessages;
};
