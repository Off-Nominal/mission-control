import {
  BaseMessageOptions,
  Guild,
  Message,
  MessageEditOptions,
} from "discord.js";
import { API } from "../../../providers/db/models/types";

export const getSubByType = (
  subs: API.Ndb2MsgSubscription[],
  type: API.Ndb2MsgSubscriptionType
): { messageId: string; channelId: string } | undefined => {
  const contextSub = subs.find((s) => s.type === type);

  if (!contextSub) {
    return undefined;
  }

  return {
    channelId: contextSub.channel_id,
    messageId: contextSub.message_id,
  };
};

export const fetchMessagesFromSubs = (
  subs: API.Ndb2MsgSubscription[],
  types: API.Ndb2MsgSubscriptionType[],
  guild: Guild
): Promise<Message<true>>[] => {
  return subs
    .filter((s) => types.includes(s.type))
    .map((s) => {
      return guild.channels.fetch(s.channel_id).then((channel) => {
        if (!channel) {
          throw new Error("Channel not found");
        }
        if (channel.isTextBased()) {
          return channel.messages.fetch(s.message_id);
        } else {
          throw new Error("Not a text-based channel");
        }
      });
    });
};

export const generateSender = (guild: Guild) => {
  return (
    channelId: string,
    embeds: BaseMessageOptions["embeds"],
    components: BaseMessageOptions["components"]
  ) => {
    return guild.channels.fetch(channelId).then((channel) => {
      if (!channel || !channel.isTextBased()) {
        throw new Error("Context channel is not text based");
      }

      return channel.send({ embeds, components });
    });
  };
};

export const generateBulkMessageUpdater = (
  subs: API.Ndb2MsgSubscription[],
  guild: Guild
) => {
  return (
    subTypes: API.Ndb2MsgSubscriptionType[],
    options: MessageEditOptions
  ) => {
    const messages = fetchMessagesFromSubs(subs, subTypes, guild);

    messages.map((mp) => {
      return mp.then((m) => {
        return m.edit(options);
      });
    });
  };
};
