import axios, { AxiosInstance } from "axios";
import {
  APIEnhancedPrediction,
  APIEnhancedUser,
  APIUser,
  ClosePredictionResponse,
  Record,
} from "./types";

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

    return this.client
      .get<APIUser[]>(url.toString())
      .then((res) => res.data[0]);
  }

  public fetchEnhancedUser(id: string | number) {
    const url = new URL(this.baseURL);
    url.pathname = `api/users/${id}`;

    return this.client
      .get<APIEnhancedUser>(url.toString())
      .then((res) => res.data);
  }

  public fetchPrediction(id: string | number) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}`;

    return this.client
      .get<APIEnhancedPrediction>(url.toString())
      .then((res) => res.data);
  }

  public newPrediction(
    text: string,
    due: string,
    predictorId: number,
    messageId: string,
    channelId: string
  ) {
    const url = new URL(this.baseURL);
    url.pathname = "api/predictions";
    return this.client
      .post<APIEnhancedPrediction>(url.toString(), {
        text,
        due,
        predictorId,
        messageId,
        channelId,
      })
      .then((res) => res.data);
  }

  public newBet(
    predictionId: string | number,
    betterId: string | number,
    endorsed: boolean
  ) {
    const url = new URL(this.baseURL);
    url.pathname = "api/bets";
    return this.client
      .post<Record>(url.toString(), {
        predictionId,
        betterId,
        endorsed,
      })
      .then((res) => res.data);
  }

  public newVote(
    predictionId: string | number,
    voterId: string | number,
    affirmative: boolean
  ) {
    const url = new URL(this.baseURL);
    url.pathname = "api/votes";
    return this.client
      .post<Record>(url.toString(), {
        predictionId,
        voterId,
        affirmative,
      })
      .then((res) => res.data);
  }

  public triggerPrediction(
    id: string | number,
    closer_discord_id: string | null = null,
    closed: Date | null = null
  ) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}`;
    return this.client
      .post<ClosePredictionResponse>(url.toString(), {
        closer_discord_id,
        closed,
      })
      .then((res) => res.data[0]);
  }

  public deletePrediction(id: string | number) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}`;
    return this.client.delete(url.toString()).then((res) => res.data);
  }
}
