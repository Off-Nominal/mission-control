import { add, isBefore, isFuture } from "date-fns";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API } from "../../../providers/ndb2-client";
import { validateUserDateInput } from "../helpers/validateUserDateInput";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TimestampStyles,
  bold,
  channelMention,
  time,
  userMention,
} from "discord.js";
import { API } from "../../../providers/db/models/types";

export default function TriggerPrediction({
  ndb2Client,
  ndb2Bot,
  cache,
  models,
}: Providers) {
  // Handles trigger request and delivers confirmation
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "trigger") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Trigger Prediction Request"
    );

    const predictionId = options.getInteger("id", true);

    let prediction: NDB2API.EnhancedPrediction;

    try {
      const response = await ndb2Client.getPrediction(predictionId);
      prediction = response.data;
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully retrieved from NDB2.`
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
        logger.sendLog(interaction.client);
        return;
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
        logger.sendLog(interaction.client);
        return;
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
        logger.sendLog(interaction.client);
        return;
      }
    }

    logger.sendLog(interaction.client);

    let id = `Trigger ${predictionId}`;

    let closeMessage: string = `You have not specified a close date for this prediction, so it will default to right now. If you know that this prediction could have been adjudicated at an earlier date, hit "Dismiss message" and issue a new \`/predict trigger\` command with the appropriate date.`;
    if (closed) {
      id += ` ${closed}`;
      const closeDate = time(new Date(closed), TimestampStyles.ShortDate);
      closeMessage = `You have specified a close date of ${closeDate}, which means you think this prediction could have been adjudicated on ${closeDate} but was not triggered. If this date is incorrect, hit "Dismiss message" and issue a new \`/predict trigger\` command without a close date specified.`;
    }

    const components = [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(id)
          .setLabel("Trigger Vote")
          .setStyle(ButtonStyle.Danger)
      ),
    ];

    const baseMessage = `You are about to trigger predicition #${
      prediction.id
    }. This will close the prediction, and no more bets (endorsements or undorsements) can be made. ${bold(
      "Proceed with caution!"
    )}`;
    const predictionMessage = `Here is the text for the prediction you are about to trigger:`;
    const confirmMessage = `If you are satisfied, click "Trigger Vote" to confirm.`;

    const content = [
      baseMessage,
      closeMessage,
      predictionMessage,
      `\`${prediction.text}\``,
      confirmMessage,
    ].join("\n\n");

    if (cache.ndb2.triggers[prediction.id]) {
      cache.ndb2.triggers[prediction.id].deleteReply();
    }
    cache.ndb2.triggers[prediction.id] = interaction;

    setTimeout(() => {
      // Clear unused confirmation dialog
      cache.ndb2.triggers[prediction.id]
        ?.fetchReply()
        .then((reply) => {
          if (reply.deletable) {
            return reply.delete();
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          delete cache.ndb2.triggers[prediction.id];
        });
    }, 600000);

    interaction.reply({ content, components, ephemeral: true });

    logger.sendLog(interaction.client);
  });

  // Handles actual trigger
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }
    const [command, predictionId, ...args] = interaction.customId.split(" ");

    if (command !== "Trigger") {
      return;
    }

    const closed_date = args[0];

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "Trigger Prediction"
    );

    let prediction: NDB2API.EnhancedPrediction;

    try {
      const response = await ndb2Client.getPrediction(predictionId);
      prediction = response.data;
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully retrieved from NDB2.`
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
        content: `There was an error fetching the prediction for this retirement. ${userError}`,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.WARNING,
        `There was an error fetching the prediction for this trigger. ${logError}`
      );
      return;
    }

    // Clear the confirmation dialog
    try {
      cache.ndb2.triggers[prediction.id]?.deleteReply().then(() => {
        delete cache.ndb2.triggers[prediction.id];
      });
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, `Could not clear confirmation dialog.`);
      console.error(err);
    }

    // Trigger the prediction
    try {
      const closeDate =
        closed_date === ""
          ? undefined
          : add(new Date(closed_date), { hours: 23, minutes: 59, seconds: 59 });

      await ndb2Client.triggerPrediction(
        prediction.id,
        interaction.user.id,
        closeDate
      );
      logger.addLog(LogStatus.SUCCESS, `Prediction triggered successfully.`);
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
        content: `Triggering this prediction failed. ${userError}`,
        ephemeral: true,
      });

      logger.addLog(
        LogStatus.FAILURE,
        `Error sending retirement request to API. ${logError}`
      );

      logger.sendLog(interaction.client);
      return;
    }

    // Fetch context channel
    let contextChannelId: string;

    try {
      const [contextSub] = await models.ndb2MsgSubscription.fetchSubByType(
        prediction.id,
        API.Ndb2MsgSubscriptionType.CONTEXT
      );
      logger.addLog(
        LogStatus.SUCCESS,
        `Fetched prediction context successfully.`
      );

      contextChannelId = contextSub.channel_id;
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction creation context could not be retrieved. Fallback to current channel will be used.`
      );
      contextChannelId = interaction.channelId;
    }

    const showContextLink = interaction.channelId !== contextChannelId;

    // Send Response
    try {
      const baseMessage = `Prediction #${
        prediction.id
      } has been triggered by ${userMention(
        interaction.user.id
      )}; voting can now begin.`;

      await interaction.reply({
        content:
          baseMessage + showContextLink
            ? `A voting notice will be posted in ${channelMention(
                contextChannelId
              )}. Awaiting notice link...`
            : "",
      });

      if (showContextLink) {
        cache.ndb2.triggerResponses[prediction.id] = interaction;
      }

      logger.addLog(
        LogStatus.SUCCESS,
        `Channel successfully notified of prediction trigger.`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Error sending interaction response to user.`
      );
      logger.sendLog(interaction.client);
      return;
    }

    logger.sendLog(interaction.client);
  });
}
