import { Client } from "discord.js";
import { generatePresenceData } from "../../../helpers/generatePresenceData";
import fetchGuild from "../../../helpers/fetchGuild";

export default function handleReady(client: Client) {
  client.user.setPresence(generatePresenceData("/help"));

  // Find Off-Nominal Discord Guild, fetch members to prevent partials
  const guild = fetchGuild(client);
  guild.members
    .fetch()
    .catch((err) =>
      console.error("Error fetching partials for Guild Members", err)
    );
}
