import { Client } from "discord.js";
import { generatePresenceData } from "../../../helpers/generatePresenceData";

export default function handleReady(client: Client) {
  client.user.setPresence(generatePresenceData("/bookclub help"));
}
