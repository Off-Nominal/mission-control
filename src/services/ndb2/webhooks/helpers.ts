import {
  BaseMessageOptions,
  Guild,
  Message,
  MessageEditOptions,
} from "discord.js";
import { API } from "../../../providers/db/models/types";

/** Discord REST: Unknown Channel, Unknown Message — resource gone or inaccessible */
const DISCORD_NOT_FOUND_CODES = new Set([10003, 10008]);

export function isDiscordNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    DISCORD_NOT_FOUND_CODES.has((err as { code: number }).code)
  );
}

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
): Promise<(Message<true> | null)>[] => {
  return subs
    .filter((s) => types.includes(s.type))
    .map((s) => {
      return guild.channels
        .fetch(s.channel_id)
        .then((channel) => {
          if (!channel || !channel.isTextBased()) {
            return null;
          }
          return channel.messages.fetch(s.message_id).catch((err: unknown) => {
            if (isDiscordNotFound(err)) {
              return null;
            }
            throw err;
          });
        })
        .catch((err: unknown) => {
          if (isDiscordNotFound(err)) {
            return null;
          }
          throw err;
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

    for (const mp of messages) {
      mp
        .then((m) => (m ? m.edit(options) : undefined))
        .catch((err: unknown) => {
          if (!isDiscordNotFound(err)) {
            console.error(err);
          }
        });
    }
  };
};
