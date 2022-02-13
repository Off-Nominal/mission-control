import { Client } from "discord.js";
import getNextTime from "../helpers/getNextTime";

export default function scheduleThreadDigest(client: Client) {
  const nextThreadDigestTime = getNextTime({ hour: 12 });
  const nextThreadDigestInterval = nextThreadDigestTime.getTime() - Date.now();
  setTimeout(() => {
    client.emit("threadDigestSend");
    scheduleThreadDigest(client);
  }, nextThreadDigestInterval);
}
