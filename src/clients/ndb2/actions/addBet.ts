import { Ndb2Client } from "../../../utilities/ndb2Client";

export const addBet = async (
  client: Ndb2Client,
  discordId: string,
  predictionId: string | number,
  endorsed: boolean
) => {
  try {
    const { id } = await client.fetchUserId(discordId);
    const result = await client.newBet(predictionId, id, endorsed);
    return result;
  } catch (err) {
    throw err;
  }
};
