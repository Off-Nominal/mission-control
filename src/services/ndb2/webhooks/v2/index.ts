import * as API_v2 from "@offnominal/ndb2-api-types";
import {
  fetchMessagesFromSubs,
  generateBulkMessageUpdater,
  getSubByType,
} from "../helpers";
import { API } from "../../../../providers/db/models/types";
import { Ndb2MsgSubscription } from "../../../../providers/db/models/Ndb2MsgSubscription";
import { getGuildFromContext, getLoggerFromContext } from "../contexts";
import { LogStatus } from "../../../../logger/Logger";
import { generateInteractionReplyFromTemplate } from "../../actions/embedGenerators/templates";
import { NDB2EmbedTemplate } from "../../actions/embedGenerators/templates/helpers/types";
import { userMention } from "discord.js";

export const handleV2Webhook = (
  payload: API_v2.Webhooks.Payload,
  ndb2MsgSubscription: Ndb2MsgSubscription
) => {
  const logger = getLoggerFromContext();
  const guild = getGuildFromContext();

  // Fetch subscriptions to prediction in Discord
  const subsPromise = ndb2MsgSubscription
    .fetchActiveSubs(payload.data.prediction.id)
    .then((subs) => {
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched ${subs.length} subscriptions to process for this event.`
      );
      return subs;
    })
    .catch((err) => {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch message subscriptions for this event, cannot process any further.`
      );
      throw err;
    });

  // Fetch discord user for Prediction
  const predictorPromise = guild.members
    .fetch(payload.data.prediction.predictor.discord_id)
    .then((predictor) => {
      logger.addLog(
        LogStatus.SUCCESS,
        `Successfully fetched predictor User ${userMention(predictor.id)}.`
      );
      return predictor;
    })
    .catch((err) => {
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch predictor User ${userMention(
          payload.data.prediction.predictor.discord_id
        )} for this event, will fallback to defauls.`
      );
      throw err;
    });

  Promise.all([subsPromise, predictorPromise]).then(([subs, predictor]) => {
    logger.addLog(LogStatus.INFO, `Passing log to update functions.`);

    const contextMessage = getSubByType(
      subs,
      API.Ndb2MsgSubscriptionType.CONTEXT
    );

    const updateBulkMessages = generateBulkMessageUpdater(subs, guild);

    const updateStandardViews = (
      prediction: API_v2.Entities.Predictions.Prediction
    ) => {
      const standardViewOptions = generateInteractionReplyFromTemplate(
        NDB2EmbedTemplate.View.STANDARD,
        {
          prediction,
          displayName: predictor?.displayName,
          avatarUrl: predictor?.displayAvatarURL(),
          context: contextMessage,
        }
      );

      updateBulkMessages([API.Ndb2MsgSubscriptionType.VIEW], {
        embeds: standardViewOptions[0],
        components: standardViewOptions[1],
      });
    };

    switch (payload.event_name) {
      case "untriggered_prediction": {
        // update VIEW subs
        updateStandardViews(payload.data.prediction);

        // Delete any trigger notices
        const messages = fetchMessagesFromSubs(
          subs,
          [API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE],
          guild
        );

        messages.map((mp) => {
          return mp.then((m) => {
            return m.delete();
          });
        });

        // Expire any subs for trigger notices
        const triggerSubs = subs.filter(
          (s) => s.type === API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE
        );

        triggerSubs.map((sub) => {
          return ndb2MsgSubscription.expireSubById(sub.id);
        });
      }
    }
  });
};
