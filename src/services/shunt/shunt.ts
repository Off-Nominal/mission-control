import {
  CommandInteraction,
  Message,
  EmbedBuilder,
  ChannelType,
  GuildBasedChannel,
  InteractionCallbackResponse,
  ChatInputCommandInteraction,
} from "discord.js";
import { Logger, LogInitiator, LogStatus } from "../../logger/Logger";

// Embed Generator
const generateEmbed = (options: {
  direction: "inbound" | "outbound";
  sourceChannelName: string;
  targetChannelName: string;
  shunterName: string;
  topic: string;
  url?: string;
}) => {
  const {
    url,
    direction,
    sourceChannelName,
    targetChannelName,
    shunterName,
    topic,
  } = options;

  const copy = {
    inbound: {
      title: `Incoming conversation from #${sourceChannelName}`,
      description: `${shunterName}: "${topic}"${
        url ? `- [Read the original](${url})` : ""
      }`,
      thumbnail: "https://i.imgur.com/kfvmby0.png",
    },
    outbound: {
      title: `Conversation moving to #${targetChannelName}`,
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

export default async function shunt(
  interaction: ChatInputCommandInteraction,
  targetChannel: GuildBasedChannel,
  topic: string
) {
  const logger = new Logger(
    "Shunt Interaction",
    LogInitiator.DISCORD,
    "Shunt Command"
  );

  logger.addLog(
    LogStatus.INFO,
    `Received a Shunt command, validating data and initiating shunt.`
  );

  const sourceChannel = interaction.channel;

  // Only accept shunts/threads from/to a text channel or thread
  if (!sourceChannel.isTextBased() || !targetChannel.isTextBased()) {
    logger.addLog(
      LogStatus.WARNING,
      `Shunt command was not sent from non Text-based Channel.`
    );
    logger.sendLog(interaction.client);
    return interaction.reply({
      content:
        "The Shunt command only works from a Text Channel or a Public Thread. It won't work via DM or other sources.",
    });
  }

  // Prevent shunting to same channel
  if (sourceChannel.id === targetChannel.id) {
    logger.addLog(
      LogStatus.INFO,
      `Shunt command was targeting same channel, ignoring.`
    );
    logger.sendLog(interaction.client);
    return interaction.reply({
      content: "Cannot shunt to the same place.",
    });
  }

  const shunter = interaction.member;

  // Fetch Server Nickname
  let shunterName: string | null = null;
  try {
    shunterName = await interaction.guild.members
      .fetch(shunter.user.id)
      .then((member) => {
        return member.nickname || member.user.username;
      });
  } catch (err) {
    logger.addLog(
      LogStatus.WARNING,
      `There was an error fetching the shunter nickname. Falling back to username.`
    );
    console.error("Unable to fetch shunter nickname");
    console.error(err);
    shunterName = shunter.user.username;
  }

  // Source Message
  let sourceReply: InteractionCallbackResponse | null = null;

  let success = true;

  try {
    sourceReply = await interaction.reply({
      embeds: [
        generateEmbed({
          direction: "outbound",
          sourceChannelName: sourceChannel.name,
          targetChannelName: targetChannel.name,
          shunterName,
          topic,
        }),
      ],
      withResponse: true,
    });
    logger.addLog(LogStatus.SUCCESS, `Shunt source message sent.`);
  } catch (err) {
    success = false;
    logger.addLog(
      LogStatus.WARNING,
      `There was an error sending the source message.`
    );
    console.error("Unable to send Shunt/Thread Source Message");
    console.error(err);
  }

  // Destination Message
  let destinationMessage: Message | null = null;
  try {
    destinationMessage = await targetChannel.send({
      embeds: [
        generateEmbed({
          url: sourceReply.resource.message.url,
          sourceChannelName: sourceChannel.name,
          targetChannelName: targetChannel.name,
          shunterName,
          topic,
          direction: "inbound",
        }),
      ],
    });

    logger.addLog(LogStatus.SUCCESS, `Shunt destination message sent.`);
  } catch (err) {
    success = false;
    logger.addLog(
      LogStatus.WARNING,
      `There was an error sending the destination message.`
    );
    console.error("Could send destintation embed");
    console.error(err);
  }

  try {
    await interaction.editReply({
      embeds: [
        generateEmbed({
          url: destinationMessage.url,
          sourceChannelName: targetChannel.name,
          targetChannelName: sourceChannel.name,
          shunterName,
          topic,
          direction: "outbound",
        }),
      ],
    });

    logger.addLog(
      LogStatus.SUCCESS,
      `Shunt source message edited with destination URL.`
    );
  } catch (err) {
    success = false;
    logger.addLog(
      LogStatus.WARNING,
      `There was an error editing the source message with the destination URL.`
    );
    console.error("Unable to edit Shunt/Thread Source Message");
    console.error(err);
  }

  if (success) {
    logger.addLog(
      LogStatus.SUCCESS,
      `Shunt command was successfully executed.`
    );
  } else {
    logger.addLog(
      LogStatus.FAILURE,
      `Shunt command was executed, but there were errors.`
    );
  }

  return await logger.sendLog(interaction.client);
}
