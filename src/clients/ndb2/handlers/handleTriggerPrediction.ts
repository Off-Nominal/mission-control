import { ButtonInteraction, channelMention, userMention } from "discord.js";
import { Logger, LogInitiator, LogStatus } from "../../../services/logger";
import { ndb2Client } from "../../../utilities/ndb2Client";
import { NDB2API } from "../../../utilities/ndb2Client/types";
import ndb2InteractionCache from "../../../utilities/ndb2Client/ndb2InteractionCache";
import {
  fetchSubByType,
  Ndb2MsgSubscriptionType,
} from "../../../queries/ndb2_msg_subscriptions";
import { add } from "date-fns";

export default async function handleTriggerPrediction(
  interaction: ButtonInteraction,
  predictionId: string,
  closed_date?: string
) {
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
  } catch ([userError, LogError]) {
    interaction.reply({
      content: `There was an error fetching the prediction for this retirement. ${userError}`,
      ephemeral: true,
    });
    return logger.addLog(
      LogStatus.WARNING,
      `There was an error fetching the prediction for this trigger. ${LogError}`
    );
  }

  // Clear the confirmation dialog
  try {
    ndb2InteractionCache.triggers[prediction.id]?.deleteReply().then(() => {
      delete ndb2InteractionCache.triggers[prediction.id];
    });
  } catch (err) {
    logger.addLog(LogStatus.FAILURE, `Could not clear confirmation dialog.`);
    console.error(err);
  }

  // Trigger the prediction
  try {
    await ndb2Client.triggerPrediction(
      prediction.id,
      interaction.user.id,
      closed_date &&
        add(new Date(closed_date), { hours: 23, minutes: 59, seconds: 59 })
    );
    logger.addLog(LogStatus.SUCCESS, `Prediction triggered successfully.`);
  } catch ([userError, LogError]) {
    interaction.reply({
      content: `Triggering this prediction failed. ${userError}`,
      ephemeral: true,
    });

    logger.addLog(
      LogStatus.FAILURE,
      `Error sending retirement request to API. ${LogError}`
    );

    return logger.sendLog(interaction.client);
  }

  // Fetch context channel
  let contextChannelId: string;

  try {
    const [contextSub] = await fetchSubByType(
      prediction.id,
      Ndb2MsgSubscriptionType.CONTEXT
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
      ndb2InteractionCache.triggerResponses[prediction.id] = interaction;
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
    return logger.sendLog(interaction.client);
  }

  logger.sendLog(interaction.client);
}
