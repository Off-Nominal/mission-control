import { sub } from "date-fns";
import { FetchMessagesOptions, MessageManager } from "discord.js";

const DISCORD_API_LIMIT = 100; // Discord's API prevents more than 100 messages per API call

interface CacheableTextChannel {
  messages: MessageManager;
}

export const fillMessageCache = async <T extends CacheableTextChannel>(
  channel: T,
  hours: number
): Promise<T> => {
  const options: FetchMessagesOptions = {
    limit: DISCORD_API_LIMIT,
  };

  let oldestMessage = channel.messages.cache.last();

  const now = new Date();
  const timeHorizon = sub(now, { hours }); // The oldest Date a message can be to fit within specified window

  if (oldestMessage) {
    options.before = oldestMessage.id;
  }

  const fetcher = async () => {
    if (
      oldestMessage &&
      oldestMessage.createdTimestamp < timeHorizon.getTime()
    ) {
      return channel;
    }

    try {
      const fetchResult = await channel.messages.fetch(options);

      // no more messages to fetch
      if (fetchResult.size < options.limit) {
        return channel;
      }

      oldestMessage = channel.messages.cache.last();
      options.before = oldestMessage.id;
      return await fetcher();
    } catch (err) {
      throw err;
    }
  };

  return fetcher();
};
