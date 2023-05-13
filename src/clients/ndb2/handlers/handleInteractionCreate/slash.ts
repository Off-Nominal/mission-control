import {
  ActionRowBuilder,
  bold,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  time,
  TimestampStyles,
} from "@discordjs/builders";
import {
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextInputStyle,
} from "discord.js";
import { Ndb2Subcommand } from "../../../../commands/ndb2";
import { LogInitiator } from "../../../../types/logEnums";
import { Logger, LogStatus } from "../../../../utilities/logger";
import { ndb2Client } from "../../../../utilities/ndb2Client";
import { NDB2API } from "../../../../utilities/ndb2Client/types";
import ndb2InteractionCache from "../../../../utilities/ndb2Client/ndb2InteractionCache";
import { Ndb2Events } from "../../../../types/eventEnums";
import { validateUserDateInput } from "../../helpers/validateUserDateInput";
import { add, isBefore, isFuture } from "date-fns";
import fetchGuild from "../../../../utilities/fetchGuild";
import { roleIds } from "../../../../types/roleEnums";
import { SpecificRole } from "../../../../types/roleEnums";

export const handleSlashCommandInteraction = async (
  interaction: ChatInputCommandInteraction
) => {
  const logger = new Logger(
    "NDB2 Interaction",
    LogInitiator.NDB2,
    "NDB2 Slash Command Interaction Handler"
  );

  const { options, commandName } = interaction;
  const subCommand = options.getSubcommand(false);

  if (commandName !== "predict") {
    logger.addLog(
      LogStatus.WARNING,
      `User invoked a command other than predict, which is not supported.`
    );
    logger.sendLog(interaction.client);
    return interaction.reply({
      content: "Invalid Command. Try `/predict help` to see how I work.",
      ephemeral: true,
    });
  }

  if (subCommand === Ndb2Subcommand.HELP) {
    const embed = new EmbedBuilder({
      title: "NDB2 Help",
      description:
        "Here are some short descriptions of commands you can do in NDB2! All commands are initiated using the slash command format, by typing `/predict`.",
      fields: [
        {
          name: "Create a new Prediction",
          value:
            "`/predict new` - Open the New Prediction window to log your best guess.",
        },
        {
          name: "View Prediction",
          value:
            "`/predict view [id]` - View the details of a specific prediction using its id. Example: `/predict view 100`.",
        },
        {
          name: "Retire Prediction",
          value:
            "`/predict retire [id]` - Retire a prediction you just made (if the date or text is wrong). Must be done within 12 hours of creation. Example: `/predict retire 100`.",
        },
        {
          name: "Trigger Prediction",
          value:
            "`/predict trigger [id]` - Trigger a prediction if it is ready to be judged now. NDB2 will automatically trigger predictions when their due date arrives, but you can use this to trigger it early if we already know the results. Example: `/predict trigger 100`. **Optionally**, you may add an effective close date for your trigger, indicating the date we knew the results. This is useful for triggering a prediction 'in the past' when we forget to trigger it at the time. Example: `/predict trigger 100 2020-05-09",
        },
        {
          name: "List Predictions",
          value:
            "`/predict list [type]` - View a list of predictions by a certain type. Currently supported is 'Recently Made' for ten most recently made predictions and 'Upcoming Judgements' for next ten predictions that are soon to trigger. Example: `/predict list upcoming`.",
        },
        {
          name: "Search Predictions",
          value:
            "`/predict search [keyword]` - Get a list of top ten matches to a keyword search. Example: `/predict search starship`.",
        },
        {
          name: "View Score",
          value:
            "`/predict score [optional: brag]` - View your own all-time scores and stats, including points, predictions, bets and votes. Responses are private unless the optional brag option is set to true. Example: `/predict score`.",
        },
        {
          name: "View Leaderboards",
          value:
            "`/predict leaderboards [type]` - View the leaderboards (top 10 players) in three categories. Currently supported are Most Points, Most Successful Predictions, and Most Successful bets. Responses are private unless the optional brag option is set to true. Example: `/predict leaderboards points`.",
        },
      ],
    });

    return interaction.reply({ embeds: [embed] });
  }

  if (subCommand === Ndb2Subcommand.NEW) {
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

    logger.addLog(
      LogStatus.INFO,
      `Received a NEW PREDICTION request, handing off to NEW PREDICTION handler.`
    );
    logger.sendLog(interaction.client);

    return await interaction.showModal(modal);
  }

  if (subCommand === Ndb2Subcommand.SCORE) {
    logger.addLog(
      LogStatus.INFO,
      `Received a Score request, handing off to Score handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(Ndb2Events.VIEW_SCORE, interaction);
  }

  if (subCommand === Ndb2Subcommand.LIST) {
    logger.addLog(
      LogStatus.INFO,
      `Received a List request, handing off to List handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(Ndb2Events.LIST_PREDICTIONS, interaction);
  }

  if (subCommand === Ndb2Subcommand.SEARCH) {
    logger.addLog(
      LogStatus.INFO,
      `Received a Search request, handing off to Search handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(Ndb2Events.SEARCH_PREDICTIONS, interaction);
  }

  if (subCommand === Ndb2Subcommand.LEADERBOARDS) {
    logger.addLog(
      LogStatus.INFO,
      `Received a Leaderboards request, handing off to Leaderboards handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(Ndb2Events.VIEW_LEADERBOARDS, interaction);
  }

  // Prediction specific commands

  const predictionId = options.getInteger("id");

  let prediction: NDB2API.EnhancedPrediction;

  try {
    const response = await ndb2Client.getPrediction(predictionId);
    prediction = response.data;
    logger.addLog(
      LogStatus.SUCCESS,
      `Prediction was successfully retrieved from NDB2.`
    );
  } catch ([userError, logError]) {
    logger.addLog(
      LogStatus.WARNING,
      `There was an error fetching this prediction. ${logError}`
    );
    logger.sendLog(interaction.client);

    return interaction.reply({
      content: `There was an error fetching this prediction. ${userError}`,
      ephemeral: true,
    });
  }

  if (subCommand === Ndb2Subcommand.RETIRE) {
    logger.addLog(
      LogStatus.INFO,
      `Received a RETIRE Prediction request, validating data and initiating confirmation message.`
    );

    const deleterId = interaction.user.id;

    if (deleterId !== prediction.predictor.discord_id) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to retire another user's predition.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "You cannot retire other people's predictions.",
        ephemeral: true,
      });
    }

    const now = new Date();
    const createDate = new Date(prediction.created_date);
    const editWindow = add(createDate, { hours: 12 });

    if (isBefore(editWindow, now)) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to retire prediction after edit window.`
      );
      logger.sendLog(interaction.client);
      return interaction.reply({
        content: "Predictions can only be deleted within 12 hours of creation.",
        ephemeral: true,
      });
    }

    logger.sendLog(interaction.client);

    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`Retire ${predictionId}`)
          .setLabel("Retire")
          .setStyle(ButtonStyle.Danger)
      ),
    ];

    const content = `Retiring a prediction can only be done in the first ${process.env.GM_PREDICTION_UPDATE_WINDOW_HOURS} hours of its creation. If you decide to proceed with the cancellation, a public notice of the cancellation will be posted, and all bets against it will be cancelled as well. If you understand and still want to continue, click the button below.\n\nHere is the prediction you are about to retire:\n\n${prediction.text}`;

    if (ndb2InteractionCache.retirements[prediction.id]) {
      ndb2InteractionCache.retirements[prediction.id].deleteReply();
    }
    ndb2InteractionCache.retirements[prediction.id] = interaction;

    setTimeout(() => {
      // Clear unused confirmation dialog
      ndb2InteractionCache.retirements[prediction.id]
        ?.fetchReply()
        .then((reply) => {
          if (reply.deletable) {
            return reply.delete();
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          delete ndb2InteractionCache.retirements[prediction.id];
        });
    }, 600000);

    return interaction.reply({ content, components, ephemeral: true });
  }

  if (subCommand === Ndb2Subcommand.TRIGGER) {
    const closed = options.getString("closed");

    logger.addLog(
      LogStatus.INFO,
      `Received a TRIGGER Prediction request, validating data and initiating confirmation message.`
    );

    if (closed) {
      // Validate Close Date format
      const isDueDateValid = validateUserDateInput(closed);
      if (!isDueDateValid) {
        interaction.reply({
          content: `Your close date format was invalid. Ensure it is entered as YYYY-MM-DD.`,
          ephemeral: true,
        });
        logger.addLog(
          LogStatus.WARNING,
          `User entered invalid timestamp, trigger rejected`
        );
        return logger.sendLog(interaction.client);
      }

      const closed_date = new Date(closed);

      // Validate Close Date is in the past
      if (isFuture(closed_date)) {
        interaction.reply({
          content:
            "Your close date is in the future. Either leave it blank to trigger effective now, or put in a past date.",
          ephemeral: true,
        });
        logger.addLog(
          LogStatus.WARNING,
          `User entered close date in the future, trigger rejected`
        );
        return logger.sendLog(interaction.client);
      }

      // Validate Close Date is before prediction creation date
      if (isBefore(closed_date, new Date(prediction.created_date))) {
        interaction.reply({
          content: `Your close date is before the prediction's creation date, which can't happen. Either leave it blank to trigger effective now, or put in a date after ${time(
            new Date(prediction.created_date)
          )}.`,
          ephemeral: true,
        });
        logger.addLog(
          LogStatus.WARNING,
          `User entered close date before prediction creation date, trigger rejected`
        );
        return logger.sendLog(interaction.client);
      }
    }

    logger.sendLog(interaction.client);

    let id = `Trigger ${predictionId}`;

    if (closed) {
      id += ` ${closed}`;
    }

    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(id)
          .setLabel("Trigger Vote")
          .setStyle(ButtonStyle.Danger)
      ),
    ];

    const closeDate = time(new Date(closed), TimestampStyles.ShortDate);

    const baseMessage = `You are about to trigger predicition #${
      prediction.id
    }. This will close the prediction, and no more bets (endorsements or undorsements) can be made. ${bold(
      "Proceed with caution!"
    )}`;
    const noCloseDateMessage = `You have not specified a close date for this prediction, so it will default to right now. If you know that this prediction could have been adjudicated at an earlier date, hit "Dismiss message" and issue a new \`/predict trigger\` command with the appropriate date.`;
    const hasCloseDateMessage = `You have specified a close date of ${closeDate}, which means you think this prediction could have been adjudicated on ${closeDate} but was not triggered. If this date is incorrect, hit "Dismiss message" and issue a new \`/predict trigger\` command without a close date specified.`;
    const predictionMessage = `Here is the text for the prediction you are about to trigger:`;
    const confirmMessage = `If you are satisfied, click "Trigger Vote" to confirm.`;

    const content = [
      baseMessage,
      !!closed ? hasCloseDateMessage : noCloseDateMessage,
      predictionMessage,
      `\`${prediction.text}\``,
      confirmMessage,
    ].join("\n\n");

    if (ndb2InteractionCache.triggers[prediction.id]) {
      ndb2InteractionCache.triggers[prediction.id].deleteReply();
    }
    ndb2InteractionCache.triggers[prediction.id] = interaction;

    setTimeout(() => {
      // Clear unused confirmation dialog
      ndb2InteractionCache.triggers[prediction.id]
        ?.fetchReply()
        .then((reply) => {
          if (reply.deletable) {
            return reply.delete();
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          delete ndb2InteractionCache.triggers[prediction.id];
        });
    }, 600000);

    return interaction.reply({ content, components, ephemeral: true });
  }

  if (subCommand === Ndb2Subcommand.VIEW) {
    logger.addLog(
      LogStatus.INFO,
      `Received a View Prediction request, handing off to View Prediction handler.`
    );
    logger.sendLog(interaction.client);
    return interaction.client.emit(
      Ndb2Events.VIEW_PREDICTION,
      interaction,
      prediction
    );
  }

  logger.addLog(
    LogStatus.WARNING,
    "This code should be unreachable, something weird happened."
  );

  interaction.reply({
    content:
      "Something went wrong and I didn't now how to handle this request, please tell Jake",
  });

  logger.sendLog(interaction.client);
};
