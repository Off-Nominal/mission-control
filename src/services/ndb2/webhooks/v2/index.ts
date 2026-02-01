import * as API_v2 from "@offnominal/ndb2-api-types/v2";
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
      console.error(err);
      logger.addLog(
        LogStatus.FAILURE,
        `Failed to fetch predictor User ${userMention(
          payload.data.prediction.predictor.discord_id
        )} for this event, will fallback to defauls.`
      );
      return undefined;
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

    const clearNoticeSubs = (types: API.Ndb2MsgSubscriptionType[]) => {
      const messages = fetchMessagesFromSubs(subs, types, guild);

      messages.map((mp) => {
        return mp.then((m) => {
          return m.delete();
        });
      });

      const noticeSubs = subs.filter((s) => types.includes(s.type));

      noticeSubs.map((sub) => {
        return ndb2MsgSubscription.expireSubById(sub.id);
      });
    };

    switch (payload.event_name) {
      case "untriggered_prediction": {
        // update VIEW subs
        updateStandardViews(payload.data.prediction);

        // Delete any trigger notices
        clearNoticeSubs([API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE]);
      }
      case "unjudged_prediction": {
        // update VIEW subs
        updateStandardViews(payload.data.prediction);

        // Delete any trigger or judgement notices
        clearNoticeSubs([
          API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
          API.Ndb2MsgSubscriptionType.JUDGEMENT_NOTICE,
        ]);

        break;
      }
      case "retired_prediction": {
        // update VIEW subs
        updateStandardViews(payload.data.prediction);

        break;
      }
    }
  });
};
