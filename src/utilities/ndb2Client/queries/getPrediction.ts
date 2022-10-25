import { Ndb2Client } from "../../../utilities/ndb2Client";

export const generateGetPrediction =
  (client: Ndb2Client) => async (predictionId: string | number) => {
    try {
      const prediction = await client.fetchPrediction(predictionId);
      return { ...prediction, due: new Date(prediction.due) };
    } catch (err) {
      return err;
    }
  };
