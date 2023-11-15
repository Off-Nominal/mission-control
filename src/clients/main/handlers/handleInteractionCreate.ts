import { GuildBasedChannel, Interaction, Message } from "discord.js";
import createPollEmbed from "../actions/poll/createPollEmbed";
import { generateHelpEmbed } from "../actions/generateHelpEmbed";
import generateSummaryHelpEmbed from "../actions/generateSummary/generateSummaryHelpEmbed";
import { marsTime } from "../actions/marstime/marsTime";
import shunt from "../actions/shunt";
import letters from "../../../helpers/pollIndicators";
import createPollHelpEmbed from "../actions/poll/createPollHelpEmbed";
import { HelperBotEvents } from "../../../types/eventEnums";

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  if (!interaction.isChatInputCommand()) return;

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (commandName === "shunt") {
    const channel = options.getChannel("channel", true) as GuildBasedChannel;
    const topic = options.getString("topic", true);
    shunt(interaction, channel, topic);
  }

  if (commandName === "help") {
    interaction.reply({ embeds: [generateHelpEmbed()] });
  }

  if (commandName === "marstime") {
    const spacecraft = options.getString("spacecraft");
    const embed = await marsTime(spacecraft);
    interaction.reply({ embeds: [embed] });
  }

  if (commandName === "summary") {
    if (subCommand === "help") {
      return interaction.reply({ embeds: [generateSummaryHelpEmbed()] });
    }

    interaction.client.emit(HelperBotEvents.SUMMARY_CREATE, interaction);
  }

  if (commandName === "poll") {
    if (subCommand === "help") {
      const embed = createPollHelpEmbed();
      return await interaction.reply({ embeds: [embed] });
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
  }
}
