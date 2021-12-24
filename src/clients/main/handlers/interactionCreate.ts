import { Interaction } from "discord.js";

export default function handleInteractionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  console.log(commandName);
}
