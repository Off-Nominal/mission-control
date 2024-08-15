import { userMention, messageLink } from "@discordjs/builders";
import { Client, GuildMember } from "discord.js";
import fetchGuild from "../../../helpers/fetchGuild";
import { Logger, LogStatus, LogInitiator } from "../../../logger/Logger";
import { add } from "date-fns";
import { generatePublicNotice } from "./generatePublicNotice";
import mcconfig from "../../../mcconfig";
import { NDB2API } from "../../../providers/ndb2-client";
import cache from "../../../providers/cache";
import { NDB2WebhookEvent } from "../webhooks";
import { API } from "../../../providers/db/models/types";
import { Ndb2MsgSubscription } from "../../../providers/db/models/Ndb2MsgSubscription";

const fallbackContextChannelId = mcconfig.discord.channels.general;

const getLoggerFields = (
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION,
  triggerer_id: string
): [string, string] => {
  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    return ["Retirement Notice", "Prediction retired"];
  }

  if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
    return ["Judgement Notice", "Prediction judged"];
  }

  if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
    return [
      "Trigger Notice",
      `Prediction triggered ${triggerer_id ? "manually" : "automatically"} by ${
        triggerer_id ? `user ${userMention(triggerer_id)}` : "NDB2"
      }`,
    ];
  }
};

export const sendPublicNotice = async (
  discordClient: Client,
  ndb2Model: Ndb2MsgSubscription,
  predictor: GuildMember,
  prediction: NDB2API.EnhancedPrediction,
  type:
    | NDB2WebhookEvent.JUDGED_PREDICTION
    | NDB2WebhookEvent.RETIRED_PREDICTION
    | NDB2WebhookEvent.TRIGGERED_PREDICTION
) => {
  const [loggerTitle, loggerMessage] = getLoggerFields(
    type,
    prediction.triggerer?.discord_id
  );

  const logger = new Logger(
    loggerTitle,
    LogInitiator.NDB2,
    loggerMessage,
    discordClient
  );

  const guild = fetchGuild(discordClient);

  const triggerer: Promise<GuildMember | null> = prediction.triggerer
    ? guild.members
        .fetch(prediction.triggerer.discord_id)
        .then((triggerer) => {
          logger.addLog(
            LogStatus.SUCCESS,
            "Triggerer Discord profile successfully fetched"
          );
          return triggerer;
        })
        .catch((err) => {
          console.error(err);
          logger.addLog(
            LogStatus.FAILURE,
            `Failed to fetch triggerer from Discord, cannot post notice.`
          );
          throw err;
        })
    : Promise.resolve(null);

  let channelId: string;
  let messageId: string;
  let context: Promise<API.Ndb2MsgSubscription[]>;

  // Retired predictions post notice in the channel they are retired
  if (type === NDB2WebhookEvent.RETIRED_PREDICTION) {
    context = ndb2Model.fetchSubByType(
      prediction.id,
      API.Ndb2MsgSubscriptionType.RETIREMENT
    );
  } else {
    // Judgements and Triggers go in their original channel
    context = ndb2Model.fetchSubByType(
      prediction.id,
      API.Ndb2MsgSubscriptionType.CONTEXT
    );
  }

  const channel = context.then(([contextSub]) => {
    if (!contextSub) {
      logger.addLog(
        LogStatus.FAILURE,
        `No context subscription found, using fallback`
      );
      channelId = fallbackContextChannelId;
    } else {
      channelId = contextSub.channel_id;
      messageId = contextSub.message_id;
    }
    return guild.channels.fetch(channelId);
  });

  Promise.all([predictor, channel, triggerer])
    .then(([predictor, channel, triggerer]) => {
      if (!channel.isTextBased()) {
        throw new Error("Context channel is not text based");
      }

      const response = generatePublicNotice(
        prediction,
        type,
        predictor,
        triggerer,
        discordClient,
        { channelId, messageId }
      );

      return channel
        .send(response)
        .then((message) => {
          if (type === NDB2WebhookEvent.TRIGGERED_PREDICTION) {
            ndb2Model.addSubscription(
              API.Ndb2MsgSubscriptionType.TRIGGER_NOTICE,
              prediction.id,
              message.channel.id,
              message.id,
              add(new Date(), { hours: 36 })
            );

            const triggerNoticeInteraction =
              cache.ndb2.triggerResponses[prediction.id];

            if (triggerNoticeInteraction) {
              triggerNoticeInteraction
                .editReply({
                  content: `Prediction #${
                    prediction.id
                  } has been triggered by ${userMention(
                    triggerNoticeInteraction.user.id
                  )}; voting can now begin. A voting notice has been posted at ${messageLink(
                    channel.id,
                    message.id
                  )}`,
                })
                .catch((err) => {
                  console.error(err);
                })
                .finally(() => {
                  delete cache.ndb2.triggerResponses[prediction.id];
                });
            }
          }
          if (type === NDB2WebhookEvent.JUDGED_PREDICTION) {
            ndb2Model.addSubscription(
              API.Ndb2MsgSubscriptionType.JUDGEMENT_NOTICE,
              prediction.id,
              message.channel.id,
              message.id
            );
          }
        })
        .then(() => {
          logger.addLog(
            LogStatus.SUCCESS,
            "Sucessfully logged subscription for notice"
          );
        })
        .catch((err) => {
          console.error(err);
          logger.addLog(
            LogStatus.FAILURE,
            `Could not log subscription to vote notice.`
          );
        });
    })
    .catch((err) => {
      console.error(err);
      logger.addLog(LogStatus.FAILURE, `Could not send public notice.`);
    })
    .finally(() => {
      return logger.sendLog(discordClient);
    });
};
