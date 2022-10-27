import { Ndb2Client } from "..";

export const generateAddVote = (client: Ndb2Client) => {
  const addVote = async (
    discordId: string,
    predictionId: string | number,
    affirmative: boolean
  ) => {
    try {
      const { id } = await client.fetchUserId(discordId);
      return await client.newVote(predictionId, id, affirmative);
    } catch (err) {
      throw err;
    }
  };

  return addVote;
};
