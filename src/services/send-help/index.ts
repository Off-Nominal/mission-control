import { Providers } from "../../providers";
import { sendContentBotHelp } from "./contentBot";

export default function SendHelp({ contentBot }: Providers) {
  contentBot.on("interactionCreate", sendContentBotHelp);
}
