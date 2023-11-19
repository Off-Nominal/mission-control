import { Client } from "discord.js";
import { Providers } from "../../providers";
import getNextTime from "../../helpers/getNextTime";
import sendThreadDigest from "./sendThreadDigest";
import mcconfig from "../../mcconfig";
import { parseCommands } from "../../helpers/parseCommands";

function scheduleThreadDigest(client: Client) {
  const nextThreadDigestTime = getNextTime({ hour: 12 });
  const nextThreadDigestInterval = nextThreadDigestTime.getTime() - Date.now();
  setTimeout(() => {
    sendThreadDigest(client);
    scheduleThreadDigest(client);
  }, nextThreadDigestInterval);
}

export default function ThreadDigest({ helperBot }: Providers) {
  helperBot.on("ready", (client) => {
    scheduleThreadDigest(client);
  });

  // allows for manual thread digest send in dev
  if (mcconfig.env === "development") {
    helperBot.on("messageCreate", (message) => {
      if (message.author.bot) return;

      const [prefix, show] = parseCommands(message);

      if (prefix === "!threaddigest") {
        sendThreadDigest(message.client);
      }
    });
  }
}
