import { EmbedBuilder } from "discord.js";

export default function createPollHelpEmbed() {
  return new EmbedBuilder()
    .setTitle("Creating polls")
    .setDescription(
      "Ask the community a question with multiple answers. Polling supports up to 10 answers."
    )
    .addFields([
      {
        name: "Start polls",
        value:
          "Start a new poll by using the slash command `/poll ask` and then adding up to ten options. The first two options are required. Example: `/poll ask question:What bean is best? choice-1:Kidney Bean choice-2:Black Bean choice-3:Pinto Bean`.",
      },
    ]);
}
