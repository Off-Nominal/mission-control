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
