import { EmbedBuilder, Message } from "discord.js";
import { Providers } from "../../providers";
import { createPollEmbed, letters } from "../../actions/create-poll-embed";

function createPollHelpEmbed() {
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

export default function Poll({ helperBot }: Providers) {
  helperBot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { options, commandName } = interaction;

    if (commandName !== "poll") return;

    const subCommand = options.getSubcommand(false);

    if (subCommand === "help") {
      const embed = createPollHelpEmbed();
      interaction.reply({ embeds: [embed] });
    }

    const question = options.getString("question");
    const answers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((num) => options.getString(`choice-${num.toString()}`))
      .filter((answer) => !!answer);
    const poll = createPollEmbed(question, answers);

    try {
      await interaction.reply({ embeds: [poll] });
      const reply = (await interaction.fetchReply()) as Message<boolean>;
      await Promise.all(answers.map((answer, i) => reply.react(letters[i])));
    } catch (err) {
      console.error(err);
    }
  });
}
