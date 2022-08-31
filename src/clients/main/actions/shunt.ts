import {
  CommandInteraction,
  Message,
  EmbedBuilder,
  ChannelType,
  GuildBasedChannel,
} from "discord.js";

export default async function shunt(
  interaction: CommandInteraction,
  targetChannel: GuildBasedChannel,
  topic: string
) {
  const sourceChannel = interaction.channel;

  // Only accept shunts/threads from/to a text channel or thread
  if (
    (sourceChannel.type !== ChannelType.GuildText &&
      sourceChannel.type !== ChannelType.GuildPublicThread) ||
    (targetChannel.type !== ChannelType.GuildText &&
      targetChannel.type !== ChannelType.GuildPublicThread)
  ) {
    return interaction.reply({
      content:
        "The Shunt command only works from a Text Channel or a Public Thread. It won't work via DM or other sources.",
    });
  }

  // Prevent shunting to same channel
  if (sourceChannel.id === targetChannel.id) {
    return interaction.reply({
      content: "Cannot shunt to the same place.",
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

    return new EmbedBuilder()
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
    sourceReply = await interaction.fetchReply();
  } catch (err) {
    console.error("Unable to send Shunt/Thread Source Message");
    console.error(err);
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
    return await interaction.editReply({
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
