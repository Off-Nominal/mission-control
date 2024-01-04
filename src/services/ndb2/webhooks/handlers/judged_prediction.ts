import { Client, Guild, GuildMember, Message } from "discord.js";
import { generatePublicNotice } from "../../actions/generatePublicNotice";
import mcconfig from "../../../../mcconfig";
import { NDB2API } from "../../../../providers/ndb2-client";
import { NDB2WebhookEvent } from "..";
import { API } from "../../../../providers/db/models/types";
import { Ndb2MsgSubscription } from "../../../../providers/db/models/Ndb2MsgSubscription";

const fallbackContextChannelId = mcconfig.discord.channels.general;

export const judgedPredictionWebhookHandler = async (
  discordClient: Client,
  guild: Guild,
  ndb2Model: Ndb2MsgSubscription,
  predictor: GuildMember,
  prediction: NDB2API.EnhancedPrediction
): Promise<Message<true>> => {
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

  return channel
    .then((channel) => {
      if (!channel.isTextBased()) {
        throw new Error("Context channel is not text based");
      }

      const response = generatePublicNotice(
        prediction,
        NDB2WebhookEvent.JUDGED_PREDICTION,
        predictor,
        null,
        discordClient,
        { channelId, messageId }
      );

      return channel.send(response);
    })
    .then((message) => {
      ndb2Model.addSubscription(
        API.Ndb2MsgSubscriptionType.JUDGEMENT_NOTICE,
        prediction.id,
        message.channel.id,
        message.id
      );

      return message;
    });
};
