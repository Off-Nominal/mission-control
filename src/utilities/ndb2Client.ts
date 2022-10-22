import axios, { AxiosInstance } from "axios";

type User = {
  id: number;
  discord_id: string;
};

type AddPredictionResponse = {
  id: number;
  text: string;
  predictor_id: number;
  due: string;
};

export class Ndb2Client {
  private baseURL = process.env.NDB2_API_BASEURL;
  private client: AxiosInstance;

  constructor(key) {
    this.client = axios.create({
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  }

  public fetchUserId(discordId: string) {
    const url = new URL(this.baseURL);
    url.pathname = "api/users";
    const params = new URLSearchParams({ discordId });
    url.search = params.toString();

    return this.client.get<User>(url.toString()).then((res) => res.data[0]);
  }

  public newPrediction(text: string, due: string, predictorId: number) {
    const url = new URL(this.baseURL);
    url.pathname = "api/predictions";
    return this.client
      .post<AddPredictionResponse>(url.toString(), {
        text,
        due,
        predictorId,
      })
      .then((res) => res.data);
  }

  public newBet(
    predictionId: string | number,
    betterId: string | number,
    endorse: boolean
  ) {
    const url = new URL(this.baseURL);
    url.pathname = "api/bets";
    return this.client
      .post(url.toString(), {
        predictionId,
        betterId,
        endorse,
      })
      .then((res) => res.data);
  }
}
