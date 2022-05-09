import { sub } from "date-fns";
import {
  ChannelLogsQueryOptions,
  Collection,
  Message,
  Snowflake,
  TextChannel,
  ThreadChannel,
} from "discord.js";

const DISCORD_API_LIMIT = 100; // Discord's API prevents more than 100 messages per API call

export const fetchMessagesInLast = async (
  channel: TextChannel | ThreadChannel,
  hourLimit: number
): Promise<Collection<string, Message<boolean>>> => {
  const options: ChannelLogsQueryOptions = {
    limit: DISCORD_API_LIMIT,
  };

  let messagePoint: Snowflake;
  let messages = new Collection<string, Message>();
  let lastMessageReached = false;

  const now = new Date();
  const timeHorizon = sub(now, { hours: hourLimit }); // The oldest Date a message can be to fit within specified window

  const fetcher = async () => {
    if (messagePoint) {
      options.before = messagePoint;
    }

    try {
      const response = await channel.messages.fetch(options);

      if (response.size < 100) {
        lastMessageReached = true;
      }

      messagePoint = response.last().id;
      messages = messages.concat(response);
    } catch (err) {
      throw err;
    }

    const timeStamp = new Date(messages.last().createdTimestamp);

    if (timeStamp < timeHorizon || lastMessageReached) {
      return; // if the last message spans the time horizon, or you've reached the first message in the thread
    }

    await fetcher(); // recursively call fetcher
  };

  try {
    await fetcher();
  } catch (err) {
    throw err;
  }

  // Remove items older than time limit
  // Since the original API calls go in batches, the last batch usually fetches
  // messages past the time limit. This removes them.
  messages = messages && messages.filter((msg) => msg.createdAt > timeHorizon);

  return messages;
};
