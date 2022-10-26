import { isFuture, isValid } from "date-fns";
import {
  ActionRowBuilder,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Ndb2Subcommand } from "../../../commands/ndb2";

import queries from "../../../utilities/ndb2Client/queries/index";
import { generatePredictionEmbed } from "../actions/generatePredictionEmbed";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
const { addBet, addPrediction, getPrediction } = queries;

export default async function handleInteractionCreate(
  interaction: Interaction
) {
  // Handle Modal Submissions for new Predictions
  if (interaction.isModalSubmit()) {
    const text = interaction.fields.getTextInputValue("text");
    const due = interaction.fields.getTextInputValue("due");
    const discordId = interaction.member.user.id;
    const messageId = interaction.channel.lastMessageId;
    const channelId = interaction.channelId;

    // Validate date format
    const isDueDateValid = isValid(new Date(due));
    if (!isDueDateValid) {
      return interaction.reply({
        content:
          "Your Due date format was invalid. Ensure it is entered as YYYY-MM-DD",
        ephemeral: true,
      });
    }

    // Validate date is in the future
    if (!isFuture(new Date(due))) {
      return interaction.reply({
        content:
          "Your due date is in the past. Predictions are for the future. Please try again.",
        ephemeral: true,
      });
    }

    try {
      const prediction = await addPrediction(
        discordId,
        text,
        due,
        messageId,
        channelId
      );
      const reply = await generatePredictionResponse(interaction, prediction);
      interaction.reply(reply);
    } catch (err) {
      console.error(err);
    }

    return;
  }

  // Handle Button Submissions for Endorsements and Undorsements
  if (interaction.isButton()) {
    const [command, predictionId] = interaction.customId.split(" ");
    const endorsed = command === "Endorse";
    const discordId = interaction.member.user.id;

    try {
      await addBet(discordId, predictionId, endorsed);
      interaction.reply({
        content: `Prediction successfully ${command.toLowerCase()}d!`,
        ephemeral: true,
      });
    } catch (err) {
      return interaction.reply({
        content: err.response.data.error,
        ephemeral: true,
      });
    }

    try {
      const buttonMsg = await interaction.message;
      const prediction = await getPrediction(predictionId);
      const predictor = await interaction.guild.members.fetch(
        prediction.predictor.discord_id
      );

      const embed = generatePredictionEmbed(predictor.nickname, prediction);
      await buttonMsg.edit({ embeds: [embed] });
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

    getPrediction(predictionId)
      .catch((err) => {
        throw interaction.reply({
          content: "No prediction exists with that id.",
          ephemeral: true,
        });
      })
      .then((prediction) => generatePredictionResponse(interaction, prediction))
      .then((reply) => interaction.reply(reply))
      .catch((err) => {
        console.error(err);
      });
  }
}
