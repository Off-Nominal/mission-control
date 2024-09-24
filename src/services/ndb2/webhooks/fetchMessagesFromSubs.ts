import { Guild, Message } from "discord.js";
import { API } from "../../../providers/db/models/types";

export const fetchMessagesFromSubs = (
  subs: API.Ndb2MsgSubscription[],
  types: API.Ndb2MsgSubscriptionType[],
  guild: Guild
): Promise<Message<true>>[] => {
  return subs
    .filter((s) => types.includes(s.type))
    .map((s) => {
      return guild.channels.fetch(s.channel_id).then((c) => {
        if (c.isTextBased()) {
          return c.messages.fetch(s.message_id);
        } else {
          throw new Error("Not a text-based channel");
        }
      });
    });
};
