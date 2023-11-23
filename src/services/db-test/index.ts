import { parseCommands } from "../../helpers/parseCommands";
import { Providers } from "../../providers";

export default function DBTest({ db, helperBot, mcconfig }: Providers) {
  if (mcconfig.env !== "dev") return;

  helperBot.on("messageCreate", (message) => {
    if (message.author.bot) return;

    const [prefix] = parseCommands(message);

    if (prefix !== "!dbtest") return;

    console.log("[DEV]: dbtest invoked");
    db.query("SELECT NOW()")
      .then((res) =>
        console.log(`[DEV]: Time on database is ${res.rows[0].now}`)
      )
      .catch((err) => {
        console.error("[DEV]: Could not connect to db");
        console.error("[DEV]:", err);
      });
  });
}
