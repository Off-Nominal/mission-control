import {
  CommandInteraction,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js";

export default async function shunt(
  interaction: CommandInteraction,
  targetChannel: TextChannel,
  topic: string,
  thread: boolean
) {
  const sourceChannel = interaction.channel;

  // Only accept shunts/threads from a text channel
  if (sourceChannel.type !== "GUILD_TEXT") {
    return interaction.reply({
      content:
        "The Shunt command only works from a Text Channel. It won't work via DM or other sources.",
    });
  }

  // Prevent shunting to same channel
  if (sourceChannel.id === targetChannel.id) {
    return interaction.reply({
      content: "Cannot shunt to the same channel.",
    });
  }

  const shunter = interaction.member.user;
  const shunterName = shunter.username;

  // Embed Generator
  const generateEmbed = (options: {
    direction: "inbound" | "outbound";
    url?: string;
  }) => {
    const { url, direction } = options;

    const copy = {
      inbound: {
        title: `Incoming conversation from #${sourceChannel.name}`,
        description: `${shunterName}: "${topic}"${
          url ? `- [Read the original](${url})` : ""
        }`,
        thumbnail: "https://i.imgur.com/kfvmby0.png",
      },
      outbound: {
        title: `Conversation moving to #${targetChannel.name}`,
        description: `${shunterName}: "${topic}"${
          url ? `- [Follow the conversation!](${url})` : ""
        }`,
        thumbnail: "https://i.imgur.com/UYBbaLR.png",
      },
    };

    const { title, description, thumbnail } = copy[direction];

    return new MessageEmbed()
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(thumbnail);
  };

  // Source Message
  let sourceReply: Message<boolean> | null = null;

  try {
    await interaction.reply({
      embeds: [
        generateEmbed({
          direction: "outbound",
        }),
      ],
    });
    sourceReply = (await interaction.fetchReply()) as Message;
  } catch (err) {
    console.error("Unable to send Shunt/Thread Source Message");
    console.error(err);
  }

  // Create Thread
  if (thread) {
    try {
      const thread = await targetChannel.threads.create({
        name: topic,
        autoArchiveDuration: 1440, // One Day
      });
      thread.members.add(shunter.id);
    } catch (err) {
      console.error("Could not create thread");
      console.error(err);
    }
  }

  // Destination Message
  try {
    const destinationMessage = await targetChannel.send({
      embeds: [
        generateEmbed({
          url: sourceReply.url,
          direction: "inbound",
        }),
      ],
    });
    await interaction.editReply({
      embeds: [
        generateEmbed({
          url: destinationMessage.url,
          direction: "outbound",
        }),
      ],
    });
  } catch (err) {
    console.error("Could send destintation embed or edit source message");
    console.error(err);
  }
}
