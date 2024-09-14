import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
  cache,
}: Providers) {
  // Handles request for new prediction, asks for type
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "new") {
      return;
    }

    const baseMessage = `## What type of prediction would you like to make?`;
    const dateDriven = `__Date Driven:__ Date driven predictions are defined by a due date which you provide. If not already triggered, the system will automatically put this prediction up for a vote on the due date.`;
    const dateExample = `__Example:__ *By the end of 2050, Elon Musk will have grown a new head.*`;
    const eventDriven = `__Event Driven:__ Event driven predictions are defined by an accompanying trigger event which you define. The system will never automatically put this prediction up for a vote (so keep an eye on it!). However, you will provide a "check date", which is date that the system will check in on this prediction and ask you if it should be triggered. Think of it as a helpful reminder and set it at the earliest possible date you think it might come true.`;
    const eventExample = `__Example:__ *By the time the first person walks on Mars, Elon Musk will have grown a new head.*`;

    const content = [
      baseMessage,
      dateDriven,
      dateExample,
      eventDriven,
      eventExample,
    ].join("\n\n");

    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("New Date Driven Prediction")
          .setLabel("Date Driven")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("New Event Driven Prediction")
          .setLabel("Event Driven")
          .setStyle(ButtonStyle.Primary)
      ),
    ];

    interaction.reply({ content, components, ephemeral: true });
  });

  // // Handles request for new prediction modal
  // ndb2Bot.on("interactionCreate", async (interaction) => {
  //   if (!interaction.isChatInputCommand()) {
  //     return;
  //   }

  //   const { options, commandName } = interaction;
  //   const subCommand = options.getSubcommand(false);

  //   if (commandName !== "predict" || subCommand !== "new") {
  //     return;
  //   }

  //   const modal = new ModalBuilder()
  //     .setCustomId("Prediction Modal")
  //     .setTitle("New Nostradambot2 Prediction");

  //   const textInput = new TextInputBuilder()
  //     .setCustomId("text")
  //     .setLabel("Prediction")
  //     .setPlaceholder("The Sun will rise tomorrow")
  //     .setMaxLength(2048)
  //     .setRequired(true)
  //     .setStyle(TextInputStyle.Paragraph);

  //   const dueInput = new TextInputBuilder()
  //     .setCustomId("due")
  //     .setLabel("Prediction Due Date (UTC, format YYYY-MM-DD)")
  //     .setPlaceholder("YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD")
  //     .setMaxLength(10)
  //     .setMinLength(10)
  //     .setRequired(true)
  //     .setStyle(TextInputStyle.Short);

  //   const firstActionRow =
  //     new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
  //   const secondActionRow =
  //     new ActionRowBuilder<TextInputBuilder>().addComponents(dueInput);

  //   modal.addComponents(firstActionRow, secondActionRow);

  //   return await interaction.showModal(modal);
  // });

  // Handles actual prediction submission
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (
      !interaction.isModalSubmit() ||
      !interaction.guild ||
      !interaction.member ||
      !interaction.channel ||
      !interaction.channelId ||
      interaction.channel.isDMBased()
    ) {
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
    const messageId = interaction.channel?.lastMessageId;
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
    } catch (err) {
      if (!Array.isArray(err)) {
        logger.addLog(
          LogStatus.WARNING,
          `There was an error fetching this prediction. Could not parse error.`
        );

        interaction.reply({
          content: `There was an error fetching this prediction. Could not parse error.`,
          ephemeral: true,
        });

        logger.sendLog(interaction.client);
        return;
      }

      const [userError, logError] = err;
      interaction.reply({
        ephemeral: true,
        content: `There was an error submitting the prediction to NDB2. ${userError}`,
      });
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error submitting the prediction. ${logError}`
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

    let reply: Message<boolean> | undefined = undefined;

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
      if (botsChannel?.isTextBased() && reply) {
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
