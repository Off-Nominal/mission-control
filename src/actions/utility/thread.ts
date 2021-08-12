import { Message, MessageEmbed, TextChannel } from "discord.js";
import { getChannel } from "../../helpers/getChannel";
import { parseMessage } from "../../helpers/parseMessage";

export const thread = (message: Message) => {
  const { command, args } = parseMessage("!thread", message);

  const sourceChannel = message.channel as TextChannel;
  const targetChannel = getChannel(message, command);

  const threadCreator = message.member.displayName;

  const threadMessage = args.join(" ");

  targetChannel.threads
    .create({
      name: threadMessage,
      autoArchiveDuration: 1440, // One Day
    })
    .then((thread) => {
      const sourceEmbed = new MessageEmbed();
      sourceEmbed
        .setTitle(`Incoming thread from #${sourceChannel.name}`)
        .setDescription(
          `${threadCreator}: "${threadMessage}" - [Read the original](${message.url})`
        )
        .setThumbnail("https://i.imgur.com/kfvmby0.png");
      return thread.send({ embeds: [sourceEmbed] });
    })
    .then((firstMsg) => {
      const sourceEmbed = new MessageEmbed();
      sourceEmbed
        .setTitle(`Thread creation request`)
        .setDescription(
          `${threadCreator}: "${threadMessage}" - [Follow the thread!](${firstMsg.url})`
        )
        .setThumbnail("https://i.imgur.com/UYBbaLR.png");

      sourceChannel.send({ embeds: [sourceEmbed] });
    });
};
