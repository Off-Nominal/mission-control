import {
  ChannelLogsQueryOptions,
  Collection,
  Message,
  Snowflake,
} from "discord.js";

const DISCORD_API_LIMIT = 100; // Discord's API prevents more than 100 messages per API call

export const fetchMessages = async (message: Message, timeLimit: Date) => {
  let messagePoint: Snowflake;
  let messages = new Collection<string, Message>();

  const fetcher = async () => {
    const options: ChannelLogsQueryOptions = {
      limit: DISCORD_API_LIMIT,
    };

    if (messagePoint) {
      options.before = messagePoint;
    }

    try {
      const response = await message.channel.messages.fetch(options);
      messagePoint = response.last().id;
      messages = messages.concat(response);
    } catch (err) {
      throw err;
    }

    const timeStamp = new Date(messages.last().createdTimestamp);

    if (timeStamp > timeLimit) {
      await fetcher(); //recursively call fetcher until the accumulated Collection spans the designated time window.
    }
  };

  try {
    await fetcher();
  } catch (err) {
    throw err;
  }

  //Remove items older than time limit
  messages = messages && messages.filter((msg) => msg.createdAt > timeLimit);
  return messages;
};
