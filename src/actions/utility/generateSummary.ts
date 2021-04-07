import { sub } from "date-fns";
import { Collection, Message, MessageEmbed, Snowflake } from "discord.js";

export const generateSummary = async (message: Message) => {
  const loadingMsg = await message.channel.send("Generating Summary Report...");

  const embed = new MessageEmbed();

  let messagePoint: Snowflake;
  let messages = new Collection<string, Message>();

  const fetchMessages = async (messagePoint?: Snowflake) => {
    const options = {
      limit: 10,
      before: undefined,
    };

    if (messagePoint) {
      options.before = messagePoint;
    }

    try {
      const response = await message.channel.messages.fetch(options);
      messagePoint = response.last().id;
      console.log(messagePoint);
      messages = messages.concat(response);
    } catch (err) {
      console.error("Error fetching messages");
    }

    console.log(messages.size);

    const now = new Date();
    const timeStamp = new Date(messages.last().createdTimestamp);

    console.log(now);
    console.log(timeStamp);

    if (timeStamp > sub(now, { hours: 8 })) {
      fetchMessages(messagePoint);
    } else {
      loadingMsg.delete();

      embed
        .setTitle("Summary of Today")
        .setDescription(
          "My best attempt at summarizing activity in this channel."
        )
        .addFields(
          messages.array().map((message, index) => {
            return {
              name: message.id,
              value: message.content || "embed",
            };
          })
        );

      message.channel.send(embed);
    }
  };

  console.log(messagePoint);

  fetchMessages(messagePoint);
};
