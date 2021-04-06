import { Message, MessageEmbed } from "discord.js";

export const sendHelp = (message: Message) => {
  const embed = new MessageEmbed();

  embed
    .setTitle("How do you use these Discord bots anyway?")
    .setDescription(
      "Many bots have their own help commands. Here's a list to call them up. Consider sending them a direct message with this command in order to keep the channel free of clutter."
    )
    .addFields([
      { name: "Podcasts", value: "`!help podcast`", inline: true },
      { name: "Book Club", value: "`!bc help`", inline: true },
      { name: "NostradamBot", value: "`!ndb help`", inline: true },
      { name: "Launch Alerts", value: "`!l help`", inline: true },
      { name: "Terminal Count", value: "`!tc help`", inline: true },
      { name: "Tracking Station", value: "`!map help`", inline: true },
    ])
    .addField(
      "Shunt - Move a thread to a new channel",
      "`!shunt [targetChannel] [message]` - Request a conversation be moved to another channel."
    );

  message.channel.send(embed);
};
