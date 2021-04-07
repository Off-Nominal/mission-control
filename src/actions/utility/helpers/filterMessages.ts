import { Collection, Message } from "discord.js";

export type FilterMessagesOptions = {
  timeLimit: Date;
};

export const filterMessages = (
  collection: Collection<string, Message>,
  options?: FilterMessagesOptions
): Collection<string, Message> => {
  let filteredCollection: Collection<string, Message> = collection;

  // Remove messages with no URL
  filteredCollection = filteredCollection.filter((msg) => {
    if (!msg.content) {
      return false;
    }

    const lcMsg = msg.content.toLowerCase();
    if (lcMsg.includes("https://") || lcMsg.includes("https://")) {
      return true;
    }

    return false;
  });

  // Remove our podcasts
  filteredCollection = filteredCollection.filter((msg) => {
    const lcMsg = msg.content.toLowerCase();
    const isPodcastLink =
      lcMsg.includes("wemartians.com") ||
      lcMsg.includes("offnom.com") ||
      lcMsg.includes("mainenginecutoff.com") ||
      lcMsg.includes("patreon.com/posts/");

    return !isPodcastLink;
  });

  //Remove items older than time limit
  filteredCollection = filteredCollection.filter(
    (msg) => msg.createdAt > options.timeLimit
  );

  return filteredCollection;
};
