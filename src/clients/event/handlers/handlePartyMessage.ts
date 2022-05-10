import { GuildScheduledEvent } from "discord.js";
import fetchTextChannel from "../../actions/fetchChannel";

const LIVECHATCHANNELID = process.env.LIVECHATCHANNELID;

export default async function handlePartyMessage(
  message: string,
  event: GuildScheduledEvent<"ACTIVE">
) {
  const channel = fetchTextChannel(event.client, LIVECHATCHANNELID);

  try {
    (await channel).send(message);
  } catch (err) {
    console.error(err);
  }
}
