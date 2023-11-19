import { Client } from "discord.js";
import getNextTime from "../helpers/getNextTime";
import { HelperBotEvents } from "../providers/discord_clients/helper";

export default function scheduleThreadDigest(client: Client) {
  const nextThreadDigestTime = getNextTime({ hour: 12 });
  const nextThreadDigestInterval = nextThreadDigestTime.getTime() - Date.now();
  setTimeout(() => {
    client.emit(HelperBotEvents.THREAD_DIGEST_SEND, client);
    scheduleThreadDigest(client);
  }, nextThreadDigestInterval);
}
