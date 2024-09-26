import { isPast } from "date-fns";
import { Logger, LogInitiator, LogStatus } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API, PredictionLifeCycle } from "../../../providers/ndb2-client";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";
import { validateUserDateInput } from "../helpers/validateUserDateInput";

export default function SnoozePrediction({
  ndb2Client,
  ndb2Bot,
  models,
}: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const { options, commandName } = interaction;
    const subCommand = options.getSubcommand(false);

    if (commandName !== "predict" || subCommand !== "snooze") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Slash Command Snooze Prediction"
    );

    const predictionId = options.getInteger("id", true);

    logger.addLog(
      LogStatus.INFO,
      `Received a Snooze Prediction request for prediction ID: ${predictionId}`
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

      logger.addLog(
        LogStatus.WARNING,
        `There was an error fetching this prediction. ${logError}`
      );
      logger.sendLog(interaction.client);

      interaction.reply({
        content: `There was an error fetching this prediction. ${userError}`,
        ephemeral: true,
      });
      return;
    }

    // Only predictor can snooze a prediction proactively
    if (prediction.predictor.discord_id !== interaction.user.id) {
      logger.addLog(
        LogStatus.WARNING,
        `Someone other than the predictor is trying to snooze this prediction. Rejecting.`
      );

      interaction.reply({
        content: `Only the predictor can snooze a prediction proactively.`,
        ephemeral: true,
      });

      return logger.sendLog(ndb2Bot);
    }

    // Prediction must be open or checking
    if (
      ![PredictionLifeCycle.CHECKING, PredictionLifeCycle.OPEN].includes(
        prediction.status
      )
    ) {
      logger.addLog(
        LogStatus.WARNING,
        `Prediction is not in a snoozable status. Rejecting.`
      );

      interaction.reply({
        content: `Only open predictions can be snoozed.`,
        ephemeral: true,
      });

      return logger.sendLog(ndb2Bot);
    }

    // Check date must be valid
    const checkDate = options.getString("check_date", true);

    const isCheckDateValid = validateUserDateInput(checkDate);
    if (!isCheckDateValid) {
      interaction.reply({
        content: `Your check date format was invalid. Ensure it is entered as YYYY-MM-DD.`,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.WARNING,
        `User entered invalid timestamp, trigger rejected`
      );
      logger.sendLog(interaction.client);
      return;
    }

    const check_date = new Date(checkDate);

    // Validate Check Date is in the future
    if (isPast(check_date)) {
      interaction.reply({
        content:
          "Your Check date is in the past. Please try again with a date in the future.",
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.WARNING,
        `User entered check date in the past, snooze rejected`
      );
      logger.sendLog(interaction.client);
      return;
    }

    // // generate response
    // try {
    //   const [embeds, components] = generateInteractionReplyFromTemplate(
    //     NDB2EmbedTemplate.View.SNOOZE_CHECK,
    //     {
    //       prediction,
    //       displayName: predictor?.displayName,
    //       avatarUrl: predictor?.displayAvatarURL(),
    //       context,
    //     }
    //   );

    //   await interaction.reply({ embeds, components });
    //   logger.addLog(
    //     LogStatus.SUCCESS,
    //     `Prediction embed was successfully delivered to channel.`
    //   );
    // } catch (err) {
    //   logger.addLog(
    //     LogStatus.FAILURE,
    //     `There was an error sending the reply to the discord.`
    //   );
    //   console.error(err);
    //   logger.sendLog(interaction.client);
    //   return;
    // }
  });
}
