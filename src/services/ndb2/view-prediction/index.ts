import { GuildMember } from "discord.js";
import { LogInitiator, LogStatus, Logger } from "../../../logger/Logger";
import { Providers } from "../../../providers";
import { API } from "../../../providers/db/models/types";
import { add } from "date-fns";
import { generateInteractionReplyFromTemplate } from "../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../actions/embedGenerators/templates/helpers/types";
import * as NDB2API from "@offnominal/ndb2-api-types/v2";

export default function ViewPrediction({
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

    if (commandName !== "predict" || subCommand !== "view") {
      return;
    }

    const logger = new Logger(
      "NDB2 Interaction",
      LogInitiator.NDB2,
      "NDB2 Slash Command View Prediction"
    );

    const predictionId = options.getInteger("id", true);

    logger.addLog(
      LogStatus.INFO,
      `Received a View Prediction request for prediction ID: ${predictionId}`
    );

    let prediction: NDB2API.Entities.Predictions.Prediction;

    try {
      prediction = await ndb2Client.getPrediction(predictionId);
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

    // Generate response
    let predictor: GuildMember | undefined = undefined;

    try {
      predictor = await interaction?.guild?.members.fetch(
        prediction.predictor.discord_id
      );
      if (!predictor) {
        throw new Error("Predictor not found");
      }

      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully retrieved the predictor of this prediction.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error retrieving the predictor for this prediction. Using fallback.`
      );
    }

    // Fetch Context
    let context: { messageId: string; channelId: string } | undefined;
    let contextSub: API.Ndb2MsgSubscription;

    try {
      const contextSubs = await models.ndb2MsgSubscription.fetchSubByType(
        prediction.id,
        API.Ndb2MsgSubscriptionType.CONTEXT
      );
      if (contextSubs[0]) {
        contextSub = contextSubs[0];
        context = {
          channelId: contextSub.channel_id,
          messageId: contextSub.message_id,
        };
        logger.addLog(LogStatus.SUCCESS, `Prediction context retreived.`);
      } else {
        logger.addLog(LogStatus.INFO, `Prediction has no context.`);
      }
    } catch (err) {
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Failure to retrieve prediction context subscriptions.`
      );
    }

    // generate response
    try {
      const [embeds, components] = generateInteractionReplyFromTemplate(
        NDB2EmbedTemplate.View.STANDARD,
        {
          prediction,
          displayName: predictor?.displayName,
          avatarUrl: predictor?.displayAvatarURL(),
          context,
        }
      );

      await interaction.reply({ embeds, components });
      logger.addLog(
        LogStatus.SUCCESS,
        `Prediction embed was successfully delivered to channel.`
      );
    } catch (err) {
      logger.addLog(
        LogStatus.FAILURE,
        `There was an error sending the reply to the discord.`
      );
      console.error(err);
      logger.sendLog(interaction.client);
      return;
    }

    // Add subscription for embed
    try {
      const reply = await interaction.fetchReply();
      await models.ndb2MsgSubscription.addSubscription(
        API.Ndb2MsgSubscriptionType.VIEW,
        prediction.id,
        interaction.channelId,
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

    logger.sendLog(interaction.client);
  });
}
