import { GuildMember, EmbedBuilder, ChannelType } from "discord.js";
import { SpecificChannel } from "../../../types/channelEnums";
import fetchChannel from "../../actions/fetchChannel";

export default async function handleGuildMemberAdd(member: GuildMember) {
  const embed = new EmbedBuilder();

  embed
    .setColor("#3e7493")
    .setTitle(`Welcome to the Off-Nominal Discord, ${member.displayName}!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setDescription("Enjoy the flood of welcomes you are about to receive!")
    .addFields(
      { name: "\u200B", value: "We have two core rules:" },
      {
        name: "1. Don't be mean",
        value: "Teasing is ok, discrimination isn't.",
        inline: true,
      },
      {
        name: "2. There are no dumb questions",
        value: "This community values learning and debate.",
        inline: true,
      },
      {
        name: "\u200B",
        value: `You can learn more about the rules as well as some of the bots available to help you by checking out our Welcome Guide in <#782993058866266132>.`,
      }
    );

  try {
    const channel = await fetchChannel(
      member.client.channels,
      SpecificChannel.GENERAL
    );
    if (channel.type !== ChannelType.GuildText) return;
    channel.send({
      content: `Attention <@${member.user.id}>!`,
      embeds: [embed],
    });
  } catch (err) {
    console.error(err);
  }
}
