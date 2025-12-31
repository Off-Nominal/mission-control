import { add, isBefore } from "date-fns";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { API } from "../../../providers/db/models/types";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import * as API_v2 from "@offnominal/ndb2-api-types/v2";

export default function RetirePrediction({
  cache,
  ndb2Client,
  ndb2Bot,
  models,
  mcconfig,
}: Providers) {
  // Handles initial request for retirement and asks confirmation
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "retire") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Slash Command Retire Prediction Request"
    );

    logger.addLog(
      LogStatus.INFO,
      `Received a RETIRE Prediction request, validating data and initiating confirmation message.`
    );

    const deleterId = interaction.user.id;

    const predictionId = options.getInteger("id", true);

    let prediction: API_v2.Entities.Predictions.Prediction;

    try {
      prediction = await ndb2Client.getPrediction(predictionId);
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

      interaction.reply({
        content: `There was an error fetching this prediction. ${userError}`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (deleterId !== prediction.predictor.discord_id) {
      logger.addLog(
        LogStatus.WARNING,
        `User tried to retire another user's predition.`
      );
      logger.sendLog(interaction.client);
      interaction.reply({
        content: "You cannot retire other people's predictions.",
        flags: MessageFlags.Ephemeral,
      });
      return;
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
      interaction.reply({
        content: "Predictions can only be deleted within 12 hours of creation.",
        flags: MessageFlags.Ephemeral,
      });
      return;
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

    const content = `Retiring a prediction can only be done in the first ${mcconfig.ndb2.changeWindow} hours of its creation. If you decide to proceed with the cancellation, a public notice of the cancellation will be posted, and all bets against it will be cancelled as well. If you understand and still want to continue, click the button below.\n\nHere is the prediction you are about to retire:\n\n${prediction.text}`;

    if (cache.ndb2.retirements[prediction.id]) {
      cache.ndb2.retirements[prediction.id].deleteReply();
    }
    cache.ndb2.retirements[prediction.id] = interaction;

    setTimeout(() => {
      // Clear unused confirmation dialog
      cache.ndb2.retirements[prediction.id]
        ?.fetchReply()
        .then((reply) => {
          if (reply.deletable) {
            reply.delete();
            return;
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          delete cache.ndb2.retirements[prediction.id];
        });
    }, 600000);

    interaction.reply({ content, components, flags: MessageFlags.Ephemeral });
  });

  // Handles actual retirement
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }
    const [command, predictionId, ...args] = interaction.customId.split(" ");

    if (command !== "Retire") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "Retire Prediction"
    );

    let prediction: API_v2.Entities.Predictions.Prediction;

    try {
      prediction = await ndb2Client.getPrediction(predictionId);
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction was successfully retrieved from NDB2.`
      );
    } catch ([userError, LogError]) {
      interaction.reply({
        content: `There was an error fetching the prediction for this retirement. ${userError}`,
        flags: MessageFlags.Ephemeral,
      });
      logger.addLog(
        LogStatus.WARNING,
        `There was an error fetching the prediction for this retirement. ${LogError}`
      );
      return;
    }

    // Clear the confirmation dialog
    try {
      cache.ndb2.retirements[prediction.id]?.deleteReply().then(() => {
        delete cache.ndb2.retirements[prediction.id];
      });
    } catch (err) {
      logger.addLog(LogStatus.FAILURE, `Could not clear confirmation dialog.`);
      console.error(err);
    }

    const deleterId = interaction.user.id;

    let subId: number;
    let subSuccess = false;

    // Add and await retirement subscription so that webhook has something to operate on
    // This is an anchor so it knows where to post the retirement notice
    try {
      subId = await models.ndb2MsgSubscription.addSubscription(
        API.Ndb2MsgSubscriptionType.RETIREMENT,
        prediction.id,
        interaction.channelId
      );
      subSuccess = true;
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction retirement context logged successfully.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `Prediction retirement context could not be logged. Fallback will be used for location of retirement notice.`
      );
    }

    try {
      await ndb2Client.retirePrediction(prediction.id, deleterId);
      logger.addLog(LogStatus.SUCCESS, `Prediction retired successfully.`);
    } catch ([userError, LogError]) {
      interaction.reply({
        content: `Retiring this prediction failed. ${userError}`,
        flags: MessageFlags.Ephemeral,
      });

      // Remove subscription since retirement failed
      models.ndb2MsgSubscription
        .deleteSubById(subId)
        .catch((err) => console.error(err));

      logger.addLog(
        LogStatus.FAILURE,
        `Error sending retirement request to API. ${LogError}`
      );

      logger.sendLog(interaction.client);
      return;
    }

    try {
      const noticeMessage = subSuccess
        ? `A cancellation notice will be posted here.`
        : `There was an error capturing the current channel, so the cancellation notice may be posted in a different channel.`;
      await interaction.reply({
        content: `Prediction #${prediction.id} has been cancelled and all bets on it will not count. ${noticeMessage}`,
        flags: MessageFlags.Ephemeral,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `User successfully notified of prediction retirement.`
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
