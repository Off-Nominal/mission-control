import axios, { AxiosInstance } from "axios";
import { NDB2API } from "./types";

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

  // public fetchUserId(discordId: string) {
  //   const url = new URL(this.baseURL);
  //   url.pathname = "api/users";
  //   const params = new URLSearchParams({ discordId });
  //   url.search = params.toString();

  //   return this.client
  //     .get<APIUser[]>(url.toString())
  //     .then((res) => res.data[0]);
  // }

  // public fetchEnhancedUser(id: string | number) {
  //   const url = new URL(this.baseURL);
  //   url.pathname = `api/users/${id}`;

  //   return this.client
  //     .get<APIEnhancedUser>(url.toString())
  //     .then((res) => res.data);
  // }

  public getPrediction(
    id: string | number
  ): Promise<NDB2API.EnhancedPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}`;

    return this.client
      .get<NDB2API.GetPrediction>(url.toString())
      .then((res) => res.data.data);
  }

  public addPrediction(
    discord_id: string,
    text: string,
    due_date: string
  ): Promise<NDB2API.EnhancedPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = "api/predictions";
    return this.client
      .post<NDB2API.AddPrediction>(url.toString(), {
        text,
        due_date,
        discord_id,
      })
      .then((res) => res.data.data);
  }

  public addBet(
    prediction_id: string | number,
    discord_id: string | number,
    endorsed: boolean
  ): Promise<NDB2API.EnhancedPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = "api/bets";
    return this.client
      .post<NDB2API.AddBet>(url.toString(), {
        prediction_id,
        discord_id,
        endorsed,
      })
      .then((res) => res.data.data);
  }

  // public newVote(
  //   predictionId: string | number,
  //   voterId: string | number,
  //   affirmative: boolean
  // ) {
  //   const url = new URL(this.baseURL);
  //   url.pathname = "api/votes";
  //   return this.client
  //     .post<Record>(url.toString(), {
  //       predictionId,
  //       voterId,
  //       affirmative,
  //     })
  //     .then((res) => res.data);
  // }

  // public triggerPrediction(
  //   id: string | number,
  //   closer_discord_id: string | null = null,
  //   closed: Date | null = null
  // ) {
  //   const url = new URL(this.baseURL);
  //   url.pathname = `api/predictions/${id}`;
  //   return this.client
  //     .post<ClosePredictionResponse>(url.toString(), {
  //       closer_discord_id,
  //       closed,
  //     })
  //     .then((res) => res.data[0]);
  // }

  public retirePrediction(id: string | number, discord_id: string) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}`;
    return this.client
      .patch<NDB2API.EnhancedPrediction>(url.toString(), { discord_id })
      .then((res) => res.data);
  }
}

const ndbKey = process.env.NDB2_CLIENT_ID;
export const ndb2Client = new Ndb2Client(ndbKey);
