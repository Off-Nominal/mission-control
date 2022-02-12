import { Client } from "discord.js";
import { generatePresenceData } from "../../../helpers/generatePresenceData";
import fetchGuild from "../../actions/fetchGuild";
import { logReady } from "../../actions/logReady";

export default async function handleReady(client: Client) {
  logReady(client.user.tag);
  client.user.setPresence(generatePresenceData(`/events help`));

  try {
    const guild = await fetchGuild(client);
    const events = await guild.scheduledEvents.fetch();
    client.emit("eventsRetrieved", events);
  } catch (err) {
    console.error(err);
  }
}
