import { Ndb2Client } from "../../../utilities/ndb2Client";

export const generateAddPrediction = (client: Ndb2Client) => {
  const addPrediction = async (
    discordId: string,
    text: string,
    due: string,
    messageId: string,
    channelId: string
  ) => {
    try {
      const { id } = await client.fetchUserId(discordId);
      return await client.newPrediction(text, due, id, messageId, channelId);
    } catch (err) {
      throw err;
    }
  };

  return addPrediction;
};
