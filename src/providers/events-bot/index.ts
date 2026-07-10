import { Client } from "discord.js";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import { connectDiscordClientInBackground } from "../../helpers/discord-client-connect";

const eventsBot = new Client({
  intents: [mcconfig.discord.clients.events.intents],
});

// Handlers
eventsBot.on("error", console.error);
eventsBot.once("clientReady", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Event Bot ready");
  bootLogger.logItemSuccess("eventsBot");
});

connectDiscordClientInBackground(eventsBot, mcconfig.discord.clients.events.token, "events");

export default eventsBot;
