import { Message, MessageEmbed, TextChannel } from "discord.js";
import { getChannel } from "../../../helpers/getChannel";
import { parseMessage } from "../../../helpers/parseMessage";
import { AllowedPrefix } from "../handlers/messageCreate";

export const shunt = async (message: Message, prefix: AllowedPrefix) => {
  const { command, args } = parseMessage(prefix, message);

  const sourceChannel = message.channel as TextChannel;
  const targetChannel = getChannel(message, command);
  const isSameChannel = sourceChannel.id === targetChannel.id;

  // Prevent shunting to same channel
  if (isSameChannel && prefix === AllowedPrefix.SHUNT) {
    return sourceChannel
      .send({
        content:
          "It looks like you're trying to shunt a conversation but you targeted the thread it's already in!",
      })
      .catch((err) => {
        console.error(
          "Could not send error message about shunting in same channel."
        );
        return console.error(err);
      });
  }

  const shunter = message.member;
  const shunterName = shunter.displayName;
  const shuntMessage = args.join(" ");

  const targetEmbed = new MessageEmbed()
    .setTitle(`Incoming conversation from #${sourceChannel.name}`)
    .setDescription(
      `${shunterName}: "${shuntMessage}" - [Read the original](${message.url})`
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
        // Auto adds shunter to the thread
        thread.members.add(shunter.id);
        return thread;
      })
      .then((thread) => {
        return thread.send({ embeds: [targetEmbed] });
      })
      .catch((err) => {
        console.error("Could not create thread and send target Embed");
        throw err;
      });
  }

  if (prefix === AllowedPrefix.SHUNT) {
    targetMessage = targetChannel
      .send({ embeds: [targetEmbed] })
      .catch((err) => {
        console.error("Could not send target Embed");
        throw err;
      });
  }

  // Sends a source message back to the original thread, if it's different
  if (!isSameChannel) {
    targetMessage
      .then((message) => {
        const sourceEmbed = new MessageEmbed()
          .setTitle(`Conversation move request`)
          .setDescription(
            `${shunterName}: "${shuntMessage}" - [Follow the conversation!](${message.url})`
          )
          .setThumbnail("https://i.imgur.com/UYBbaLR.png");

        sourceChannel.send({ embeds: [sourceEmbed] });
      })
      .catch((err) => {
        console.error(err);
      });
  }
};
