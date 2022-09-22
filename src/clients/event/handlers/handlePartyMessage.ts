import {
  ChannelType,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessagePayload,
} from "discord.js";
import { SpecificChannel } from "../../../types/channelEnums";
import fetchChannel from "../../actions/fetchChannel";

export default async function handlePartyMessage(
  message: string | MessagePayload,
  event: GuildScheduledEvent<GuildScheduledEventStatus.Active>
) {
  try {
    const channel = await fetchChannel(
      event.client.channels,
      SpecificChannel.LIVECHAT
    );
    if (channel.type !== ChannelType.GuildText) return;
    channel.send(message);
  } catch (err) {
    console.error(err);
  }
}
