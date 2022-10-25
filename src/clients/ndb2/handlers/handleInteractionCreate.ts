import {
  ActionRowBuilder,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Ndb2Subcommand } from "../../../commands/ndb2";

import queries from "../../../utilities/ndb2Client/queries/index";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
const { addBet, addPrediction, getPrediction } = queries;

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  if (interaction.isModalSubmit()) {
    const text = interaction.fields.getTextInputValue("text");
    const due = interaction.fields.getTextInputValue("due");
    const discordId = interaction.member.user.id;

    try {
      const prediction = await addPrediction(discordId, text, due);
      const reply = generatePredictionResponse(interaction, prediction);
      interaction.reply(reply);
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
      const prediction = await addBet(discordId, predictionId, endorse);
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
    const predictionId = options.getInteger("id");
    let prediction;

    try {
      const prediction = await getPrediction(predictionId);
    } catch (err) {
      interaction.reply({
        content: "No prediction exists with that id.",
        ephemeral: true,
      });
    }

    try {
      const reply = generatePredictionResponse(interaction, prediction);
      interaction.reply(reply);
    } catch (err) {
      console.error(err);
      interaction.reply({ content: "Something went wrong", ephemeral: true });
    }
  }
}
