import { Client } from "discord.js";
import { generatePresenceData } from "../../../helpers/generatePresenceData";
import fetchGuild from "../../actions/fetchGuild";
import { EventBotEvents } from "../../../types/eventEnums";

export default async function handleReady(client: Client) {
  client.user.setPresence(generatePresenceData(`/events help`));

  try {
    const guild = await fetchGuild(client);
    const events = await guild.scheduledEvents.fetch();
    client.emit(EventBotEvents.RETRIEVED, events, guild.scheduledEvents);
  } catch (err) {
    console.error(err);
  }
}
