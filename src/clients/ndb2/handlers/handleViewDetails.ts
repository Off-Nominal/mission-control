import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
} from "discord.js";
import { Logger, LogInitiator, LogStatus } from "../../../logger/Logger";
import { generatePredictionDetailsEmbed } from "../actions/embedGenerators/generatePredictionDetailsEmbed";
import ndb2Client, { NDB2API } from "../../../providers/ndb2-client";

export default async function handleViewDetails(
  interaction: ButtonInteraction,
  predictionId: string,
  season: boolean
) {
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
    return logger.sendLog(interaction.client);
  }

  const embed = generatePredictionDetailsEmbed(prediction, season);

  const actionRow = new ActionRowBuilder<ButtonBuilder>();
  actionRow.addComponents(
    new ButtonBuilder()
      .setLabel("View on Web")
      .setURL("https://ndb.offnom.com/predictions/" + prediction.id)
      .setStyle(ButtonStyle.Link)
  );

  try {
    interaction.reply({
      embeds: [embed],
      components: [actionRow],
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
}
