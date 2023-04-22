import axios, { AxiosInstance } from "axios";
import { NDB2API } from "./types";

const isNdb2ApiResponse = (
  response: any
): response is NDB2API.GeneralResponse => {
  if (typeof response !== "object") {
    return false;
  }

  if (
    !("success" in response) ||
    !("errorCode" in response) ||
    !("message" in response) ||
    !("data" in response)
  ) {
    return false;
  }

  const { success, errorCode, message } = response;

  if (
    typeof success !== "boolean" ||
    typeof errorCode !== "string" ||
    (typeof message !== "string" && message !== null)
  ) {
    return false;
  }

  return true;
};

const handleError = (err: any): [string, string] => {
  // returns user friendly message and full message in array
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const statusCode = err.response.status;

      const ndb2ApiResponse = err.response.data;
      if (isNdb2ApiResponse(ndb2ApiResponse)) {
        const errorCode = ndb2ApiResponse.errorCode;
        const message =
          ndb2ApiResponse.message || "No error message indicated.";
        return [
          message,
          `HTTP Status: ${statusCode}. Error response: ${errorCode}. ${message}`,
        ];
      }

      return [
        "We received a response from NDB2 but it doesn't look right.",
        `HTTP Status ${statusCode} from NDB2 API but response failed type predicate.`,
      ];
    }

    return [
      "We didn't receive a response from the NDB2 server.",
      "Axios reports no response.",
    ];
  }

  const defaultUserMessage = "We received some kind of unknown error.";

  if (err instanceof TypeError) {
    return [defaultUserMessage, err.message];
  }

  if (err instanceof RangeError) {
    return [defaultUserMessage, err.message];
  }

  if (err instanceof EvalError) {
    return [defaultUserMessage, err.message];
  }

  if (err instanceof ReferenceError) {
    return [defaultUserMessage, err.message];
  }

  if (err instanceof SyntaxError) {
    return [defaultUserMessage, err.message];
  }

  if (err instanceof URIError) {
    return [defaultUserMessage, err.message];
  }

  if (err instanceof Error) {
    return [defaultUserMessage, err.message];
  }

  // Error passthrough for strings
  if (typeof err === "string") {
    return [defaultUserMessage, err];
  }

  // Final fallback
  return [defaultUserMessage, "Unknown error."];
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
      .then((res) => res.data.data)
      .catch((err) => {
        throw handleError(err);
      });
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
      .then((res) => res.data.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addBet(
    prediction_id: string | number,
    discord_id: string | number,
    endorsed: boolean
  ): Promise<NDB2API.EnhancedPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${prediction_id}/bets`;
    return this.client
      .post<NDB2API.AddBet>(url.toString(), {
        discord_id,
        endorsed,
      })
      .then((res) => res.data.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addVote(
    predictionId: string | number,
    discord_id: string | number,
    vote: boolean
  ) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${predictionId}/votes`;
    return this.client
      .post<NDB2API.EnhancedPrediction>(url.toString(), {
        discord_id,
        vote,
      })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public triggerPrediction(
    id: string | number,
    discord_id: string | null = null,
    closed_date?: Date
  ) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}/trigger`;
    return this.client
      .post<NDB2API.TriggerPrediction>(url.toString(), {
        discord_id,
        closed_date,
      })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public retirePrediction(id: string | number, discord_id: string) {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}/retire`;
    return this.client
      .patch<NDB2API.EnhancedPrediction>(url.toString(), { discord_id })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getScores(
    discord_id: string,
    season_id?: string | number
  ): Promise<NDB2API.GetScores> {
    const url = new URL(this.baseURL);
    url.pathname = `api/users/discord_id/${discord_id}/scores`;
    if (season_id) {
      url.pathname += `/seasons/${season_id}`;
    }
    return this.client
      .get<NDB2API.GetScores>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }
}

const ndbKey = process.env.NDB2_CLIENT_ID;
export const ndb2Client = new Ndb2Client(ndbKey);
