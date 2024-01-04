import { userMention, messageLink } from "@discordjs/builders";
import { Client, Guild, GuildMember, Message } from "discord.js";
import { add } from "date-fns";
import { generatePublicNotice } from "../../actions/generatePublicNotice";
import mcconfig from "../../../../mcconfig";
import { NDB2API } from "../../../../providers/ndb2-client";
import cache from "../../../../providers/cache";
import { NDB2WebhookEvent } from "..";
import { API } from "../../../../providers/db/models/types";
import { Ndb2MsgSubscription } from "../../../../providers/db/models/Ndb2MsgSubscription";

const fallbackContextChannelId = mcconfig.discord.channels.general;

export const triggeredPredictionWebhookHandler = async (
  discordClient: Client,
  guild: Guild,
  ndb2Model: Ndb2MsgSubscription,
  predictor: GuildMember,
  prediction: NDB2API.EnhancedPrediction
): Promise<Message<true>> => {
  const triggerer: Promise<GuildMember | null> = prediction.triggerer
    ? guild.members.fetch(prediction.triggerer.discord_id).catch((err) => {
        console.error(err);
        throw err;
      })
    : Promise.resolve(null);

  let channelId: string;
  let messageId: string;
  const context = ndb2Model.fetchSubByType(
    prediction.id,
    API.Ndb2MsgSubscriptionType.CONTEXT
  );

  const channel = context.then(([contextSub]) => {
    if (!contextSub) {
      channelId = fallbackContextChannelId;
    } else {
      channelId = contextSub.channel_id;
      messageId = contextSub.message_id;
    }
    return guild.channels.fetch(channelId);
  });

  return Promise.all([channel, triggerer])
    .then(([channel, triggerer]) => {
      if (!channel.isTextBased()) {
        throw new Error("Context channel is not text based");
      }

      const response = generatePublicNotice(
        prediction,
        NDB2WebhookEvent.TRIGGERED_PREDICTION,
        predictor,
        triggerer,
        discordClient,
        { channelId, messageId }
      );

      return channel.send(response);
    })
    .then((message) => {
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
              message.channel.id,
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

      return message;
    });
};
