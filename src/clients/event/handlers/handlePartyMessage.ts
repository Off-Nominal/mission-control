import {
  ChannelType,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessagePayload,
} from "discord.js";
import { SpecificChannel, channelIds } from "../../../types/channelEnums";

export default async function handlePartyMessage(
  message: string | MessagePayload,
  event: GuildScheduledEvent<GuildScheduledEventStatus.Active>
) {
  try {
    const channel = await event.client.channels.fetch(
      channelIds[SpecificChannel.LIVECHAT]
    );
    if (channel.type !== ChannelType.GuildText) return;
    channel.send(message);
  } catch (err) {
    console.error(err);
  }
}
