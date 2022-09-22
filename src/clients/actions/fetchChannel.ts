import { ChannelManager } from "discord.js";
import { SpecificChannel, channelIds } from "../../types/channelEnums";

export default async function fetchChannel(
  channelManager: ChannelManager,
  channel: SpecificChannel
) {
  return await channelManager.fetch(channelIds[channel]);
}
