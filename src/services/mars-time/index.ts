import { Providers } from "../../providers";
import { marsTime } from "./marsTime";

export default function MarsTime({ helperBot }: Providers) {
  helperBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "marstime") return;

    const spacecraft = options.getString("spacecraft");
    const embed = await marsTime(spacecraft);
    interaction.reply({ embeds: [embed] });
  });
}
