import { isFuture, isValid } from "date-fns";
import {
  ActionRowBuilder,
  Channel,
  channelMention,
  ChannelType,
  Interaction,
  Message,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  userMention,
} from "discord.js";
import { Ndb2Subcommand } from "../../../commands/ndb2";

import queries from "../../../utilities/ndb2Client/queries/index";
import {
  APIEnhancedPrediction,
  ClosePredictionResponse,
} from "../../../utilities/ndb2Client/types";
import { generatePredictionEmbed } from "../actions/generatePredictionEmbed";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
import { generateVoteResponse } from "../actions/generateVoteResponse";
const { addBet, addPrediction, getPrediction, triggerPrediction } = queries;

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

  // Prediction specific commands

  const predictionId = options.getInteger("id");
  let prediction: APIEnhancedPrediction;

  try {
    prediction = await getPrediction(predictionId);
  } catch (err) {
    return interaction.reply({
      content: "No prediction exists with that id.",
      ephemeral: true,
    });
  }

  if (subCommand === Ndb2Subcommand.CANCEL) {
    // Cancel
  }

  if (subCommand === Ndb2Subcommand.TRIGGER) {
    const closer_discord_id = interaction.user.id;
    const closed = new Date(options.getString("closed"));

    // Validate date format
    const isDueDateValid = isValid(closed);
    if (!isDueDateValid) {
      return interaction.reply({
        content:
          "Your close date format was invalid. Ensure it is entered as YYYY-MM-DD",
        ephemeral: true,
      });
    }

    // Validate date is in the past
    if (isFuture(closed)) {
      return interaction.reply({
        content:
          "Your close date is in the future. Either leave it blank to trigger effective now, or put in a past date.",
        ephemeral: true,
      });
    }

    // Trigger prediction
    let triggeredPrediction: ClosePredictionResponse;

    try {
      triggeredPrediction = await triggerPrediction(
        predictionId,
        closer_discord_id,
        closed
      );
    } catch (err) {
      return interaction.reply({
        content: err.response.data.error,
        ephemeral: true,
      });
    }

    // Fetch channel for Prediction Message

    let voteChannel: Channel;
    try {
      voteChannel = await interaction.client.channels.fetch(
        triggeredPrediction.channel_id
      );
    } catch (err) {
      console.log(err);
      return interaction.reply({
        content: "Error fetching channel for voting.",
      });
    }

    if (voteChannel.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: "Something went wrong. Tell Jake to check the logs.",
        ephemeral: true,
      });
    }

    // Send Voting Message
    let voteMessage: Message;

    try {
      const vote = generateVoteResponse(prediction, { closer_discord_id });
      voteMessage = await voteChannel.send(vote);
    } catch (err) {
      return interaction.reply({
        content: "Error sending vote to voting channel.",
        ephemeral: true,
      });
    }

    try {
      return interaction.reply({
        content: `Prediction #${predictionId} has been triggered. Voting will now occur in ${channelMention(
          voteChannel.id
        )}`,
      });
    } catch (err) {
      return interaction.reply({
        content: err.response.data.error,
      });
    }
  }

  if (
    subCommand === Ndb2Subcommand.ENDORSE ||
    subCommand === Ndb2Subcommand.UNDORSE
  ) {
    const endorsed = subCommand === Ndb2Subcommand.ENDORSE;
    const discordId = interaction.member.user.id;

    try {
      await addBet(discordId, predictionId, endorsed);
      interaction.reply({
        content: `Prediction successfully ${subCommand}d!`,
        ephemeral: true,
      });
    } catch (err) {
      return interaction.reply({
        content: err.response.data.error,
        ephemeral: true,
      });
    }
  }

  if (subCommand === Ndb2Subcommand.VIEW) {
    try {
      const reply = await generatePredictionResponse(interaction, prediction);
      return interaction.reply(reply);
    } catch (err) {
      console.error(err);
    }
  }
}
