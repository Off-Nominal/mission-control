import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import mcconfig from "../../mcconfig";
import { Client } from "discord.js";

const contentBot = new Client({
  intents: mcconfig.discord.clients.content.intents,
});

contentBot.on("error", console.error);
contentBot.once("ready", () => {
  bootLogger.addLog(LogStatus.SUCCESS, "Content Bot ready");
  bootLogger.logItemSuccess("contentBot");
});

contentBot.login(mcconfig.discord.clients.content.token);

export default contentBot;
