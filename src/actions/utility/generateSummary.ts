import { sub } from "date-fns";
import { Collection, Message, MessageEmbed, Snowflake } from "discord.js";
import { createFields } from "./helpers/createFields";
import { filterMessages } from "./helpers/filterMessages";

export const generateSummary = async (
  message: Message,
  hourLimit: number = 8
) => {
  if (hourLimit > 24) {
    return message.channel.send(
      "In order to maintain order, please limit summary reports to last 24 hours"
    );
  }

  const loadingMsg = await message.channel.send("Generating Summary Report...");

  const embed = new MessageEmbed();

  let messagePoint: Snowflake;
  let messages = new Collection<string, Message>();

  const fetchMessages = async (messagePoint?: Snowflake) => {
    const options = {
      limit: 100,
      before: undefined,
    };

    if (messagePoint) {
      options.before = messagePoint;
    }

    try {
      const response = await message.channel.messages.fetch(options);
      messagePoint = response.last().id;
      messages = messages.concat(response);
    } catch (err) {
      console.error("Error fetching messages");
    }

    const now = new Date();
    const timeStamp = new Date(messages.last().createdTimestamp);
    const timeLimit = sub(now, { hours: hourLimit });

    if (timeStamp > timeLimit) {
      fetchMessages(messagePoint);
    } else {
      loadingMsg.delete();

      const filteredMessages = filterMessages(messages, { timeLimit });

      embed
        .setTitle("Summary of Today")
        .setDescription(
          `News items posted in this channel in the last ${hourLimit} hours.`
        )
        .addFields(createFields(filteredMessages));

      message.channel.send(embed);
    }
  };

  fetchMessages(messagePoint);
};
