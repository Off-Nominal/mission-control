import { Providers } from "../../providers";
import sendThreadDigest from "./sendThreadDigest";
import { parseCommands } from "../../helpers/parseCommands";
import schedule from "node-schedule";

export default function ThreadDigest({ helperBot, mcconfig }: Providers) {
  const digestSchedule = "0 12 * * * ";

  helperBot.on("ready", (client) => {
    schedule.scheduleJob(digestSchedule, () => {
      sendThreadDigest(client);
    });
  });

  // allows for manual thread digest send in dev
  if (mcconfig.env === "dev") {
    helperBot.on("messageCreate", (message) => {
      if (message.author.bot) return;

      const [prefix] = parseCommands(message);

      if (prefix === "!threaddigest") {
        sendThreadDigest(message.client);
      }
    });
  }
}
