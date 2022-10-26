import { Ndb2Client } from "..";

export const generateAddBet = (client: Ndb2Client) => {
  const addBet = async (
    discordId: string,
    predictionId: string | number,
    endorsed: boolean
  ) => {
    try {
      const { id } = await client.fetchUserId(discordId);
      return await client.newBet(predictionId, id, endorsed);
    } catch (err) {
      throw err;
    }
  };

  return addBet;
};
