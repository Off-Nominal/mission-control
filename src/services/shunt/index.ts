import { BaseInteraction, ChannelType } from "discord.js";
import { Providers } from "../../providers";
import shunt from "./shunt";

export default function Shunt({ helperBot }: Providers) {
  helperBot.on("interactionCreate", (interaction: BaseInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== "shunt") return;

    const { options } = interaction;

    const channel = options.getChannel("channel", true, [
      ChannelType.GuildForum,
      ChannelType.PublicThread,
      ChannelType.GuildText,
    ]);

    const topic = options.getString("topic", true);
    shunt(interaction, channel, topic);
  });
}
