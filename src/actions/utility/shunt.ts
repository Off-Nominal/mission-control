import { Message, MessageEmbed, TextChannel } from "discord.js";
import { AllowedPrefix } from "../../handlers/message/utility";
import { getChannel } from "../../helpers/getChannel";
import { parseMessage } from "../../helpers/parseMessage";

export const shunt = async (message: Message, prefix: AllowedPrefix) => {
  const { command, args } = parseMessage(prefix, message);

  const sourceChannel = message.channel as TextChannel;
  const targetChannel = getChannel(message, command);
  const isSameChannel = sourceChannel.id === targetChannel.id;

  // Prevent shunting to same channel
  if (isSameChannel && prefix === AllowedPrefix.SHUNT) {
    return sourceChannel.send({
      content:
        "It looks like you're trying to shunt a conversation but you targeted the thread it's already in!",
    });
  }

  const shunter = message.member.displayName;
  const shuntMessage = args.join(" ");

  const targetEmbed = new MessageEmbed()
    .setTitle(`Incoming conversation from #${sourceChannel.name}`)
    .setDescription(
      `${shunter}: "${shuntMessage}" - [Read the original](${message.url})`
    )
    .setThumbnail("https://i.imgur.com/kfvmby0.png");

  let targetMessage: Promise<Message>;

  // Creates thread if necessary then sends targetEmbed there
  if (prefix === AllowedPrefix.THREAD) {
    targetMessage = targetChannel.threads
      .create({
        name: shuntMessage,
        autoArchiveDuration: 1440, // One Day
      })
      .then((thread) => {
        return thread.send({ embeds: [targetEmbed] });
      });
  }

  if (prefix === AllowedPrefix.SHUNT) {
    targetMessage = targetChannel.send({ embeds: [targetEmbed] });
  }

  // Sends a source message back to the original thread, if it's different
  if (!isSameChannel) {
    targetMessage.then((message) => {
      const sourceEmbed = new MessageEmbed()
        .setTitle(`Conversation move request`)
        .setDescription(
          `${shunter}: "${shuntMessage}" - [Follow the conversation!](${message.url})`
        )
        .setThumbnail("https://i.imgur.com/UYBbaLR.png");

      sourceChannel.send({ embeds: [sourceEmbed] });
    });
  }
};
