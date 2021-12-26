import {
  CommandInteraction,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js";
import { APIMessage } from "discord.js/node_modules/discord-api-types";

export const shunt = async (
  interaction: CommandInteraction,
  targetChannel: TextChannel,
  topic: string
) => {
  const sourceChannel = interaction.channel;
  const isSameChannel = sourceChannel.id === targetChannel.id;

  // Only accept shunts from a text channel
  if (sourceChannel.type !== "GUILD_TEXT") {
    return;
  }

  // Prevent shunting to same channel
  if (isSameChannel) {
    return interaction.reply({
      content: "Cannot shunt to the same channel.",
    });
  }

  const shunter = interaction.member;
  const shunterName = shunter.user.username;

  // Source Message
  const generateSourceEmbed = (url?: string) => {
    return new MessageEmbed()
      .setTitle(`Conversation move request`)
      .setDescription(
        `${shunterName}: "${topic}" - [Follow the conversation!](${url})`
      )
      .setThumbnail("https://i.imgur.com/UYBbaLR.png");
  };

  try {
    interaction.reply({
      embeds: [generateSourceEmbed()],
    });
  } catch (err) {
    console.error("Unable to send Shunt Source Message");
    console.error(err);
  }

  // Destination Message
  let sourceReply: Message<boolean>;

  try {
    sourceReply = (await interaction.fetchReply()) as Message;
  } catch (err) {
    console.error("Could not fetch initial reply for Shunt");
    console.error(err);
  }

  const targetEmbed = new MessageEmbed()
    .setTitle(`Incoming conversation from #${sourceChannel.name}`)
    .setDescription(
      `${shunterName}: "${topic}" - [Read the original](${sourceReply.url})`
    )
    .setThumbnail("https://i.imgur.com/kfvmby0.png");

  let destinationMessage: Message;

  try {
    destinationMessage = await targetChannel.send({ embeds: [targetEmbed] });
  } catch (err) {
    console.error("Could not send target embed for shunt");
    console.error(err);
  }

  // Update Original Message
  try {
    interaction.editReply({
      embeds: [generateSourceEmbed(destinationMessage.url)],
    });
  } catch (err) {
    console.error("Unable to edit Shunt Source Message");
    console.error(err);
  }

  // // Creates thread if necessary then sends targetEmbed there
  // if (prefix === AllowedPrefix.THREAD) {
  //   targetMessage = targetChannel.threads
  //     .create({
  //       name: shuntMessage,
  //       autoArchiveDuration: 1440, // One Day
  //     })
  //     .then((thread) => {
  //       // Auto adds shunter to the thread
  //       thread.members.add(shunter.id);
  //       return thread;
  //     })
  //     .then((thread) => {
  //       return thread.send({ embeds: [targetEmbed] });
  //     })
  //     .catch((err) => {
  //       console.error("Could not create thread and send target Embed");
  //       throw err;
  //     });
  // }

  // if (prefix === AllowedPrefix.SHUNT) {
  //   targetMessage = targetChannel
  //     .send({ embeds: [targetEmbed] })
  //     .catch((err) => {
  //       console.error("Could not send target Embed");
  //       throw err;
  //     });
  // }

  // // Sends a source message back to the original thread, if it's different
  // if (!isSameChannel) {
  //   targetMessage
  //     .then((message) => {
  //       const sourceEmbed = new MessageEmbed()
  //         .setTitle(`Conversation move request`)
  //         .setDescription(
  //           `${shunterName}: "${shuntMessage}" - [Follow the conversation!](${message.url})`
  //         )
  //         .setThumbnail("https://i.imgur.com/UYBbaLR.png");

  //       sourceChannel.send({ embeds: [sourceEmbed] });
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //     });
  // }
};
