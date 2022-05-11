import {
  GuildScheduledEvent,
  MessageOptions,
  MessagePayload,
} from "discord.js";
import fetchTextChannel from "../../actions/fetchChannel";

const LIVECHATCHANNELID = process.env.LIVECHATCHANNELID;

export default async function handlePartyMessage(
  message: string | MessagePayload | MessageOptions,
  event: GuildScheduledEvent<"ACTIVE">
) {
  const channel = fetchTextChannel(event.client, LIVECHATCHANNELID);

  try {
    (await channel).send(message);
  } catch (err) {
    console.error(err);
  }
}
