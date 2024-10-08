import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { NDB2API } from "../../../providers/ndb2-client";
import { generatePredictionDetailsEmbed } from "../actions/embedGenerators/templates/prediction_details";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";

export default function ViewDetails({ ndb2Client, ndb2Bot }: Providers) {
  ndb2Bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
      return;
    }

    const [command, predictionId, ...args] = interaction.customId.split(" ");

    if (command !== "Details") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "View Details"
    );

    let prediction: NDB2API.EnhancedPrediction;

    // Fetch prediction
    try {
      const response = await ndb2Client.getPrediction(predictionId);
      prediction = response.data;
      logger.addLog(LogStatus.SUCCESS, "Prediction successfully fetched");
    } catch ([userError, logError]) {
      interaction.reply({
        ephemeral: true,
        content: `There was an error fetching this subscription detail. ${userError}`,
      });
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error fetching the prediction ${logError}`
      );
      logger.sendLog(interaction.client);
      return;
    }

    const userRequestedSeason = args[0] === "Season";

    const [embeds, components] = generateInteractionReplyFromTemplate(
      NDB2EmbedTemplate.View.DETAILS,
      {
        prediction,
        season: userRequestedSeason,
      }
    );

    try {
      interaction.reply({
        embeds,
        components,
        ephemeral: true,
      });
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully notified user of prediction details.`
      );
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error sending the prediction details in the channel. ${err.response.data.message}`
      );
    }

    logger.sendLog(interaction.client);
  });
}
