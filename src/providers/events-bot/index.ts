import { Client } from "discord.js";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";

const eventsBot = new Client({
  intents: [mcconfig.discord.clients.events.intents],
});

// Handlers
eventsBot.on("error", console.error);
eventsBot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Event Bot ready");
  bootLogger.logItemSuccess("eventsBot");
});

eventsBot.login(mcconfig.discord.clients.events.token);

export default eventsBot;
