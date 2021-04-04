import { Message, MessageEmbed, TextChannel } from "discord.js";
import { getChannel } from "../../helpers/getChannel";
import { parseCommands } from "../../helpers/parseCommands";

export const shunt = (message: Message) => {
  const [prefix, channelName, ...rest] = parseCommands(message);

  const shunter = message.member.displayName;
  const shuntMessage = rest.join(" ");
  const sourceChannel = message.channel as TextChannel;
  const targetChannel = getChannel(message, channelName);

  const targetEmbed = new MessageEmbed();

  targetEmbed
    .setTitle(`Incoming thread from #${sourceChannel.name}`)
    .setDescription(
      `${shunter}: ${shuntMessage} - [Read the original](${message.url})`
    )
    .setThumbnail("https://i.imgur.com/kfvmby0.png");

  targetChannel
    .send(targetEmbed)
    .then((message) => {
      const sourceEmbed = new MessageEmbed();

      sourceEmbed
        .setTitle(`Conversation thread move request`)
        .setDescription(
          `${shunter}: ${shuntMessage} - [Follow the thread!](${message.url})`
        )
        .setThumbnail("https://i.imgur.com/UYBbaLR.png");

      sourceChannel.send(sourceEmbed);
    })
    .catch((err) => {
      console.error(err);
    });
};
