import { Client } from "discord.js";
import { generatePresenceData } from "../../../helpers/generatePresenceData";
import { logReady } from "../../actions/logReady";

export default function handleReady(client: Client, prefix: string) {
  logReady(client.user.tag);
  client.user.setPresence(generatePresenceData(`!${prefix} help`));
}
