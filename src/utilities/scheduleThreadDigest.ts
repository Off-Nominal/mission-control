import { Client } from "discord.js";
import { UtilityBotEvents } from "../clients/types";
import getNextTime from "../helpers/getNextTime";

export default function scheduleThreadDigest(client: Client) {
  const nextThreadDigestTime = getNextTime({ hour: 12 });
  const nextThreadDigestInterval = nextThreadDigestTime.getTime() - Date.now();
  setTimeout(() => {
    client.emit(UtilityBotEvents.THREAD_DIGEST_SEND);
    scheduleThreadDigest(client);
  }, nextThreadDigestInterval);
}
