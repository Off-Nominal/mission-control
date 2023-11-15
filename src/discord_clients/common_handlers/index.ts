import { Client } from "discord.js";
import { generatePresenceData } from "../../helpers/generatePresenceData";

export function setPresence(client: Client, message: string) {
  client.user.setPresence(generatePresenceData(message));
}

export function handleError(error: Error) {
  console.error(error.message);
}
