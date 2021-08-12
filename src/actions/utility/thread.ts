import { Message, MessageEmbed, TextChannel } from "discord.js";
import { getChannel } from "../../helpers/getChannel";
import { parseMessage } from "../../helpers/parseMessage";

export const thread = (message: Message) => {
  // const { command, args } = parseMessage("!shunt", message);
  // const sourceChannel = message.channel as TextChannel;
  // const targetChannel = getChannel(message, command);
  // if (sourceChannel.id === targetChannel.id) {
  //   return sourceChannel.send({
  //     content:
  //       "It looks like you're trying to shunt a conversation but you targeted the thread it's already in!",
  //   });
  // }
  // const shunter = message.member.displayName;
  // const shuntMessage = args.join(" ");
  // const targetEmbed = new MessageEmbed();
  // targetEmbed
  //   .setTitle(`Incoming thread from #${sourceChannel.name}`)
  //   .setDescription(
  //     `${shunter}: "${shuntMessage}" - [Read the original](${message.url})`
  //   )
  //   .setThumbnail("https://i.imgur.com/kfvmby0.png");
  // targetChannel
  //   .send({ embeds: [targetEmbed] })
  //   .then((message) => {
  //     const sourceEmbed = new MessageEmbed();
  //     sourceEmbed
  //       .setTitle(`Conversation thread move request`)
  //       .setDescription(
  //         `${shunter}: "${shuntMessage}" - [Follow the thread!](${message.url})`
  //       )
  //       .setThumbnail("https://i.imgur.com/UYBbaLR.png");
  //     sourceChannel.send({ embeds: [sourceEmbed] });
  //   })
  //   .catch((err) => {
  //     console.error(err);
  //   });
};
