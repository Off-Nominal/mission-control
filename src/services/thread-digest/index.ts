import { Client } from "discord.js";
import { Providers } from "../../providers";
import getNextTime from "../../helpers/getNextTime";
import sendThreadDigest from "./sendThreadDigest";

function scheduleThreadDigest(client: Client) {
  const nextThreadDigestTime = getNextTime({ hour: 12 });
  const nextThreadDigestInterval = nextThreadDigestTime.getTime() - Date.now();
  setTimeout(() => {
    sendThreadDigest(client);
    scheduleThreadDigest(client);
  }, nextThreadDigestInterval);
}

export default function ThreadDigest({ helperBot }: Providers) {
  helperBot.on("ready", () => {
    scheduleThreadDigest(helperBot);
  });
}
