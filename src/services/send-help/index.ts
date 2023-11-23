import { Providers } from "../../providers";
import { sendContentBotHelp } from "./contentBot";
import { sendHelperBotHelp } from "./helperBot";

export default function SendHelp({ contentBot, helperBot }: Providers) {
  contentBot.on("interactionCreate", sendContentBotHelp);
  helperBot.on("interactionCreate", sendHelperBotHelp);
}
