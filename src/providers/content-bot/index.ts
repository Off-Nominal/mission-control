import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import mcconfig from "../../mcconfig";
import { Client } from "discord.js";
import { connectDiscordClientInBackground } from "../../helpers/discord-client-connect";

const contentBot = new Client({
  intents: mcconfig.discord.clients.content.intents,
});

contentBot.on("error", console.error);
contentBot.once("clientReady", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Content Bot ready");
  bootLogger.logItemSuccess("contentBot");
});

connectDiscordClientInBackground(contentBot, mcconfig.discord.clients.content.token, "content");

export default contentBot;
