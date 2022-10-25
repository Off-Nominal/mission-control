import { Ndb2Client } from "../../../utilities/ndb2Client";

export const generateAddPrediction = (client: Ndb2Client) => {
  const addPrediction = async (
    discordId: string,
    text: string,
    due: string
  ) => {
    try {
      const { id } = await client.fetchUserId(discordId);
      const result = await client.newPrediction(text, due, id);
      const dueDate = new Date(result.due);
      return { ...result, due: dueDate };
    } catch (err) {
      throw err;
    }
  };

  return addPrediction;
};
