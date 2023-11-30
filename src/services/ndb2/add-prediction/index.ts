import {
  ActionRowBuilder,
  Message,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  TimestampStyles,
  time,
  userMention,
} from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { validateUserDateInput } from "../helpers/validateUserDateInput";
import { add, isFuture } from "date-fns";
import { NDB2API } from "../../../providers/ndb2-client";
import { generatePredictionResponse } from "../actions/generatePredictionResponse";
import { API } from "../../../providers/db/models/types";

export default function AddPrediction({
  mcconfig,
  ndb2Bot,
  ndb2Client,
  models,
}: Providers) {
  // Handles request for new prediction modal
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "retire") {
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId("Prediction Modal")
      .setTitle("New Nostradambot2 Prediction");

    const textInput = new TextInputBuilder()
      .setCustomId("text")
      .setLabel("Prediction")
      .setPlaceholder("The Sun will rise tomorrow")
      .setMaxLength(2048)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);

    const dueInput = new TextInputBuilder()
      .setCustomId("due")
      .setLabel("Prediction Due Date (UTC, format YYYY-MM-DD)")
      .setPlaceholder("YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD")
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
  });

  // Handles actual prediction submission
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 New Prediction"
    );

    const text = interaction.fields.getTextInputValue("text");
    const due = interaction.fields.getTextInputValue("due");
    const dueDate = new Date(due);
    const discordId = interaction.member.user.id;
    const messageId = interaction.channel.lastMessageId;
    const channelId = interaction.channelId;

    logger.addLog(
      LogStatus.INFO,
      `New prediction made by ${userMention(discordId)} due ${time(
        dueDate,
        TimestampStyles.RelativeTime
      )}: ${text}`
    );

    // Validate date format
    const isDueDateValid = validateUserDateInput(due);
    if (!isDueDateValid) {
      logger.addLog(
        LogStatus.WARNING,
        `User entered invalid timestamp, prediction rejected`
      );
      logger.sendLog(interaction.client);
      interaction.reply({
        content: `Your due date format was invalid. Ensure it is entered as YYYY-MM-DD. If you need to re-enter your prediction, you can copy and paste it from here:\n\n${text}`,
        ephemeral: true,
      });
      return;
    }

    logger.addLog(LogStatus.SUCCESS, `Due date is properly formed!`);

    const due_date = add(dueDate, { days: 1 });

    // Validate date is in the future
    if (!isFuture(due_date)) {
      logger.addLog(
        LogStatus.WARNING,
        `User entered timestamp in the past, prediction rejected`
      );
      logger.sendLog(interaction.client);
      interaction.reply({
        content: `Your due date is in the past. Please adjust your date and try again. If you need to reneter your prediction, you can copy and paste it from here:\n\n${text}`,
        ephemeral: true,
      });
      return;
    }

    logger.addLog(LogStatus.INFO, `Due date is correctly in the future!`);

    let prediction: NDB2API.EnhancedPrediction;

    try {
      const response = await ndb2Client.addPrediction(
        discordId,
        text,
        due_date.toISOString()
      );
      prediction = response.data;
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully submitted to NDB2`
      );
    } catch ([userError, LogError]) {
      interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the prediction to NDB2. ${userError}`,
      });
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the prediction. ${LogError}`
      );
      logger.sendLog(interaction.client);
      return;
    }

    try {
      const predictor = await interaction.guild.members.fetch(
        prediction.predictor.discord_id
      );

      const reply = generatePredictionResponse(predictor, prediction);
      interaction.reply(reply);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction embed was sent to the channel.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error responding to the prediction in the channel, but the prediction was submitted.`
      );
      console.error(err);
    }

    // Add subscription for message context
    try {
      await models.ndb2MsgSubscription.addSubscription(
        API.Ndb2MsgSubscriptionType.CONTEXT,
        prediction.id,
        channelId,
        messageId
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction context message subscription logged`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction context message subscription log failure.`
      );
      console.error(err);
    }

    let reply: Message<boolean>;

    // Add subscription for embed
    try {
      reply = await interaction.fetchReply();
      await models.ndb2MsgSubscription.addSubscription(
        API.Ndb2MsgSubscriptionType.VIEW,
        prediction.id,
        channelId,
        reply.id,
        add(new Date(), { hours: 36 })
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction view embed message subscription logged`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction view message subscription log failure.`
      );
      console.error(err);
    }

    try {
      const botsChannel = await interaction.guild.channels.cache.find(
        (c) => c.id === mcconfig.discord.channels.bots
      );
      if (botsChannel.isTextBased()) {
        botsChannel.send({
          content: `NDB2->TC ${channelId} ${reply.id} ${prediction.text}`,
        });
      }
      logger.addLog(LogStatus.SUCCESS, `New Prediction TC Alert logged`);
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `New Prediction TC Alert Message failure`
      );
      console.error(err);
    }

    logger.sendLog(interaction.client);
  });
}
