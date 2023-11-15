import {
  ChannelType,
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessagePayload,
} from "discord.js";
import mcconfig from "../../../mcconfig";

export default async function handlePartyMessage(
  message: string | MessagePayload,
  event: GuildScheduledEvent<GuildScheduledEventStatus.Active>
) {
  try {
    const channel = await event.client.channels.fetch(
      mcconfig.discord.channels.livechat
    );
    if (channel.type !== ChannelType.GuildText) return;
    channel.send(message);
  } catch (err) {
    console.error(err);
  }
}
