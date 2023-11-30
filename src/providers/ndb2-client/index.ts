import axios, { AxiosInstance } from "axios";
import { NDB2API, PredictionLifeCycle } from "./types";
import mcconfig from "../../mcconfig";
export * from "./types";

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
    typeof errorCode !== "number" ||
    (typeof message !== "string" && message !== null)
  ) {
    return false;
  }

  return true;
};

export type SearchOptions = {
  status?: PredictionLifeCycle[];
  keyword?: string;
  sort_by?: SortByOption[];
  page?: number;
  creator?: string;
  unbetter?: string;
};

export enum SortByOption {
  CREATED_ASC = "created_date-asc",
  CREATED_DESC = "created_date-desc",
  DUE_ASC = "due_date-asc",
  DUE_DESC = "due_date-desc",
  RETIRED_ASC = "retired_date-asc",
  RETIRED_DESC = "retired_date-desc",
  TRIGGERED_ASC = "triggered_date-asc",
  TRIGGERED_DESC = "triggered_date-desc",
  CLOSED_ASC = "closed_date-asc",
  CLOSED_DESC = "closed_date-desc",
  JUDGED_ASC = "judged_date-asc",
  JUDGED_DESC = "judged_date-desc",
}

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
  private baseURL = mcconfig.ndb2.baseUrl;
  private client: AxiosInstance;
  private seasons: NDB2API.Season[] = [];

  constructor(key) {
    this.client = axios.create({
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  }

  public initialize() {
    return this.getSeasons()
      .then((seasons) => {
        this.seasons = seasons.data;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  public getSeasons(): Promise<NDB2API.GetSeasons> {
    const url = new URL(this.baseURL);
    url.pathname = "api/seasons";

    return this.client
      .get<NDB2API.GetSeasons>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getSeason(id: string | number): NDB2API.Season {
    return this.seasons.find((season) => season.id === id);
  }

  public getPrediction(id: string | number): Promise<NDB2API.GetPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}`;

    return this.client
      .get<NDB2API.GetPrediction>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addPrediction(
    discord_id: string,
    text: string,
    due_date: string
  ): Promise<NDB2API.AddPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = "api/predictions";
    return this.client
      .post<NDB2API.AddPrediction>(url.toString(), {
        text,
        due_date,
        discord_id,
      })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addBet(
    prediction_id: string | number,
    discord_id: string | number,
    endorsed: boolean
  ): Promise<NDB2API.AddBet> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${prediction_id}/bets`;
    return this.client
      .post<NDB2API.AddBet>(url.toString(), {
        discord_id,
        endorsed,
      })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addVote(
    predictionId: string | number,
    discord_id: string | number,
    vote: boolean
  ): Promise<NDB2API.AddVote> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${predictionId}/votes`;
    return this.client
      .post<NDB2API.AddVote>(url.toString(), {
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
  ): Promise<NDB2API.TriggerPrediction> {
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

  public retirePrediction(
    id: string | number,
    discord_id: string
  ): Promise<NDB2API.RetirePrediction> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}/retire`;
    return this.client
      .patch<NDB2API.RetirePrediction>(url.toString(), { discord_id })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getScores(
    discord_id: string,
    seasonIdentifier?: number | "current" | "last"
  ): Promise<NDB2API.GetScores> {
    const url = new URL(this.baseURL);
    url.pathname = `api/users/discord_id/${discord_id}/scores`;
    if (seasonIdentifier) {
      url.pathname += `/seasons/${seasonIdentifier}`;
    }
    return this.client
      .get<NDB2API.GetScores>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public searchPredictions(
    options: SearchOptions = {}
  ): Promise<NDB2API.SearchPredictions> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/search`;
    const params = new URLSearchParams();

    if (options.status) {
      options.status.forEach((option) => {
        params.set("status", option);
      });
    }

    if (options.keyword) {
      params.set("keyword", options.keyword);
    }

    if (options.sort_by) {
      options.sort_by.forEach((option) => {
        params.set("sort_by", option);
      });
    }

    if (options.creator) {
      params.set("creator", options.creator);
    }

    if (options.unbetter) {
      params.set("unbetter", options.unbetter);
    }

    url.search = params.toString();

    return this.client
      .get<NDB2API.SearchPredictions>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getPointsLeaderboard(
    seasonId?: number | "current" | "last"
  ): Promise<NDB2API.GetPointsLeaderboard> {
    const url = new URL(this.baseURL);
    url.pathname = `api/scores${seasonId ? "/seasons/" + seasonId : ""}`;
    const params = new URLSearchParams();
    params.set("view", "points");
    url.search = params.toString();

    return this.client
      .get<NDB2API.GetPointsLeaderboard>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getPredictionsLeaderboard(
    seasonId?: number | "current" | "last"
  ): Promise<NDB2API.GetPredictionsLeaderboard> {
    const url = new URL(this.baseURL);
    url.pathname = `api/scores${seasonId ? "/seasons/" + seasonId : ""}`;
    const params = new URLSearchParams();
    params.set("view", "predictions");
    url.search = params.toString();

    return this.client
      .get<NDB2API.GetPredictionsLeaderboard>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getBetsLeaderboard(
    seasonId?: number | "current" | "last"
  ): Promise<NDB2API.GetBetsLeaderboard> {
    const url = new URL(this.baseURL);
    url.pathname = `api/scores${seasonId ? "/seasons/" + seasonId : ""}`;
    const params = new URLSearchParams();
    params.set("view", "bets");
    url.search = params.toString();

    return this.client
      .get<NDB2API.GetBetsLeaderboard>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError(err);
      });
  }
}

const ndbKey = mcconfig.ndb2.clientId;
const ndb2Client = new Ndb2Client(ndbKey);
ndb2Client.initialize();

export default ndb2Client;
