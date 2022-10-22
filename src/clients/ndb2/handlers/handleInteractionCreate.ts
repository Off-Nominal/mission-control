import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Ndb2Subcommand } from "../../../commands/ndb2";
import { Ndb2Client } from "../../../utilities/ndb2Client";
import { addBet } from "../actions/addBet";
import { addPrediction } from "../actions/addPrediction";
import { generatePredictionEmbed } from "../actions/generatePredictionEmbed";

const ndbKey = process.env.NDB2_CLIENT_ID;
const ndb2Client = new Ndb2Client(ndbKey);

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  if (interaction.isModalSubmit()) {
    const text = interaction.fields.getTextInputValue("text");
    const due = interaction.fields.getTextInputValue("due");
    const discordId = interaction.member.user.id;

    try {
      const prediction = await addPrediction(ndb2Client, discordId, text, due);
      const embed = generatePredictionEmbed(
        (interaction.member as GuildMember).nickname,
        prediction.id,
        prediction.text,
        prediction.due
      );
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`Endorse ${prediction.id}`)
            .setLabel("Endorse")
            .setStyle(ButtonStyle.Success)
        )
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`Undorse ${prediction.id}`)
            .setLabel("Undorse")
            .setStyle(ButtonStyle.Danger)
        );
      interaction.reply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error(err);
    }

    return;
  }

  if (interaction.isButton()) {
    const [command, predictionId] = interaction.customId.split(" ");
    const endorse = command === "Endorse";
    const discordId = interaction.member.user.id;

    console.log(endorse, discordId, predictionId);

    try {
      const prediction = await addBet(
        ndb2Client,
        discordId,
        predictionId,
        endorse
      );
      console.log(prediction);
    } catch (err) {
      console.error(err);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (commandName !== "predict") {
    return interaction.reply({
      content: "Invalid Command. Try `/predict help` to see how I work.",
      ephemeral: true,
    });
  }

  if (subCommand === Ndb2Subcommand.CANCEL) {
    // Cancel
  }

  if (subCommand === Ndb2Subcommand.ENDORSE) {
    // Endorse
  }

  if (subCommand === Ndb2Subcommand.HELP) {
    // Help
  }

  if (subCommand === Ndb2Subcommand.NEW) {
    const modal = new ModalBuilder()
      .setCustomId("Prediction Modal")
      .setTitle("New Nostradambot2 Prediction");

    const textInput = new TextInputBuilder()
      .setCustomId("text")
      .setLabel("Prediction")
      .setPlaceholder("The Sun will rise tomorrow")
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const dueInput = new TextInputBuilder()
      .setCustomId("due")
      .setLabel("Prediction Due Date")
      .setPlaceholder("YYYY-MM-DD")
      .setMaxLength(10)
      .setMinLength(10)
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(dueInput);

    modal.addComponents(firstActionRow, secondActionRow);

    return await interaction.showModal(modal);
  }

  if (subCommand === Ndb2Subcommand.SCORE) {
    // Score
  }

  if (subCommand === Ndb2Subcommand.UNDORSE) {
    // Undorse
  }

  if (subCommand === Ndb2Subcommand.VIEW) {
    // View
  }
}
