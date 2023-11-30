import { Providers } from "../../providers";
import ndb2Bot from "../../providers/ndb2-bot";
import { sendContentBotHelp } from "./contentBot";
import { sendHelperBotHelp } from "./helperBot";
import { sendNdb2Help } from "./ndb2Bot";

export default function SendHelp({ contentBot, helperBot }: Providers) {
  contentBot.on("interactionCreate", sendContentBotHelp);
  helperBot.on("interactionCreate", sendHelperBotHelp);
  ndb2Bot.on("interactionCreate", sendNdb2Help);
}
