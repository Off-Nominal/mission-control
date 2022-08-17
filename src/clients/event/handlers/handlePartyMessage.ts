import {
  GuildScheduledEvent,
  GuildScheduledEventStatus,
  MessageOptions,
  MessagePayload,
} from "discord.js";
import fetchTextChannel from "../../actions/fetchChannel";

const LIVECHATCHANNELID = process.env.LIVECHATCHANNELID;

export default async function handlePartyMessage(
  message: string | MessagePayload | MessageOptions,
  event: GuildScheduledEvent<GuildScheduledEventStatus.Active>
) {
  const channel = fetchTextChannel(event.client, LIVECHATCHANNELID);

  try {
    (await channel).send(message);
  } catch (err) {
    console.error(err);
  }
}
