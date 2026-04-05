import axios, { AxiosInstance } from "axios";
import { NDB2API as NDB2API_V1 } from "./types";
import mcconfig from "../../mcconfig";
export * from "./types";
import * as API_V2 from "@offnominal/ndb2-api-types/v2";

const isNdb2ApiResponse_v1 = (
  response: any,
): response is NDB2API_V1.GeneralResponse => {
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

const isNdb2ApiErrorResponse = (
  response: any,
): response is API_V2.Utils.ErrorResponse => {
  if (typeof response !== "object") {
    return false;
  }

  if (
    !("success" in response) ||
    !("errors" in response) ||
    !("data" in response)
  ) {
    return false;
  }

  const { success, errors } = response;

  if (typeof success !== "boolean" || !Array.isArray(errors)) {
    return false;
  }

  for (const error of errors) {
    if (typeof error.code !== "number" || typeof error.message !== "string") {
      return false;
    }
  }

  return true;
};

const handleError_v1 = (err: any): [string, string] => {
  // returns user friendly message and full message in array
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const statusCode = err.response.status;

      const ndb2ApiResponse = err.response.data;
      if (isNdb2ApiResponse_v1(ndb2ApiResponse)) {
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

const handleError = (err: any): [string, string] => {
  // returns user friendly message and full message in array
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const statusCode = err.response.status;

      const ndb2ApiResponse = err.response.data;

      if (isNdb2ApiErrorResponse(ndb2ApiResponse)) {
        const firstError = ndb2ApiResponse.errors[0];
        const errorCode = firstError.code;
        const message = firstError.message || "No error message indicated.";
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
  private baseURL = mcconfig.ndb2.baseUrl || "";
  private client: AxiosInstance;
  private seasons: API_V2.Entities.Seasons.Season[] = [];

  constructor(key: string | undefined) {
    this.client = axios.create({
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  }

  public initialize() {
    return this.getSeasons()
      .then((seasons) => {
        this.seasons = seasons;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  public getSeasons(): Promise<API_V2.Endpoints.Seasons.GET.Data> {
    const url = new URL(this.baseURL);
    url.pathname = "api/v2/seasons";

    return this.client
      .get<API_V2.Endpoints.Seasons.GET.Response>(url.toString())
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to get seasons");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getSeason(
    id: string | number,
  ): API_V2.Entities.Seasons.Season | undefined {
    return this.seasons.find((season) => season.id === id);
  }

  public getPrediction(
    id: string | number,
  ): Promise<API_V2.Endpoints.Predictions.GET_ById.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/${id}`;

    return this.client
      .get<API_V2.Endpoints.Predictions.GET_ById.Response>(url.toString())
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to get prediction");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addPrediction(
    body: API_V2.Endpoints.Predictions.POST_Predictions.Body,
  ): Promise<API_V2.Endpoints.Predictions.POST_Predictions.Data> {
    const url = new URL(this.baseURL);
    url.pathname = "api/v2/predictions";

    return this.client
      .post<API_V2.Endpoints.Predictions.POST_Predictions.Response>(
        url.toString(),
        body,
      )
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to add prediction");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addBet(
    prediction_id: string | number,
    discord_id: string | number,
    endorsed: boolean,
  ): Promise<API_V2.Endpoints.Predictions.POST_ById_bets.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/${prediction_id}/bets`;
    return this.client
      .post<API_V2.Endpoints.Predictions.POST_ById_bets.Response>(
        url.toString(),
        {
          discord_id,
          endorsed,
        },
      )
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to add bet");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addVote(
    predictionId: string | number,
    discord_id: string | number,
    vote: boolean,
  ): Promise<API_V2.Endpoints.Predictions.POST_ById_votes.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/${predictionId}/votes`;
    return this.client
      .post<API_V2.Endpoints.Predictions.POST_ById_votes.Response>(
        url.toString(),
        {
          discord_id,
          vote,
        },
      )
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to add vote");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public addSnoozeVote(
    predictionId: string | number,
    snoozeCheckId: string | number,
    discord_id: string | number,
    value: API_V2.Endpoints.Predictions.POST_ById_snooze_checks.Body["value"],
  ): Promise<API_V2.Endpoints.Predictions.POST_ById_snooze_checks.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/${predictionId}/snooze_checks/${snoozeCheckId}`;
    return this.client
      .post<API_V2.Endpoints.Predictions.POST_ById_snooze_checks.Response>(
        url.toString(),
        {
          discord_id,
          value,
        },
      )
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to add snooze vote");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public triggerPrediction(
    id: string | number,
    discord_id: string | null = null,
    closed_date?: Date,
  ): Promise<NDB2API_V1.TriggerPrediction> {
    const url = new URL(this.baseURL);
    url.pathname = `api/predictions/${id}/trigger`;
    return this.client
      .post<NDB2API_V1.TriggerPrediction>(url.toString(), {
        discord_id,
        closed_date,
      })
      .then((res) => res.data)
      .catch((err) => {
        throw handleError_v1(err);
      });
  }

  public retirePrediction(
    id: string | number,
    discord_id: string,
  ): Promise<API_V2.Endpoints.Predictions.PATCH_ById_retire.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/${id}/retire`;
    return this.client
      .patch<API_V2.Endpoints.Predictions.PATCH_ById_retire.Response>(
        url.toString(),
        { discord_id },
      )
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to retire prediction");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getScores(
    discord_id: string,
    seasonIdentifier?: number | "current" | "last",
  ): Promise<NDB2API_V1.GetScores> {
    const url = new URL(this.baseURL);
    url.pathname = `api/users/discord_id/${discord_id}/scores`;
    if (seasonIdentifier) {
      url.pathname += `/seasons/${seasonIdentifier}`;
    }
    return this.client
      .get<NDB2API_V1.GetScores>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError_v1(err);
      });
  }

  public searchPredictions(
    options: API_V2.Endpoints.Predictions.GET_Search.Query = {},
  ): Promise<API_V2.Endpoints.Predictions.GET_Search.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/search`;
    url.search =
      API_V2.Endpoints.Predictions.GET_Search.toURLSearchParams(
        options,
      ).toString();

    return this.client
      .get<API_V2.Endpoints.Predictions.GET_Search.Response>(url.toString())
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to search predictions");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }

  public getPointsLeaderboard(
    seasonId?: number | "current" | "last",
  ): Promise<NDB2API_V1.GetPointsLeaderboard> {
    const url = new URL(this.baseURL);
    url.pathname = `api/scores${seasonId ? "/seasons/" + seasonId : ""}`;
    const params = new URLSearchParams();
    params.set("view", "points");
    url.search = params.toString();

    return this.client
      .get<NDB2API_V1.GetPointsLeaderboard>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError_v1(err);
      });
  }

  public getPredictionsLeaderboard(
    seasonId?: number | "current" | "last",
  ): Promise<NDB2API_V1.GetPredictionsLeaderboard> {
    const url = new URL(this.baseURL);
    url.pathname = `api/scores${seasonId ? "/seasons/" + seasonId : ""}`;
    const params = new URLSearchParams();
    params.set("view", "predictions");
    url.search = params.toString();

    return this.client
      .get<NDB2API_V1.GetPredictionsLeaderboard>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError_v1(err);
      });
  }

  public getBetsLeaderboard(
    seasonId?: number | "current" | "last",
  ): Promise<NDB2API_V1.GetBetsLeaderboard> {
    const url = new URL(this.baseURL);
    url.pathname = `api/scores${seasonId ? "/seasons/" + seasonId : ""}`;
    const params = new URLSearchParams();
    params.set("view", "bets");
    url.search = params.toString();

    return this.client
      .get<NDB2API_V1.GetBetsLeaderboard>(url.toString())
      .then((res) => res.data)
      .catch((err) => {
        throw handleError_v1(err);
      });
  }

  public snoozePrediction(
    discord_id: string,
    predictionId: string | number,
    check_date: string | Date,
  ): Promise<API_V2.Endpoints.Predictions.PATCH_ById_snooze.Data> {
    const url = new URL(this.baseURL);
    url.pathname = `api/v2/predictions/${predictionId}/snooze`;

    return this.client
      .patch<API_V2.Endpoints.Predictions.PATCH_ById_snooze.Response>(
        url.toString(),
        {
          discord_id,
          check_date,
        },
      )
      .then((res) => {
        if (!res.data.success) {
          throw new Error("Failed to snooze prediction");
        }
        return res.data.data;
      })
      .catch((err) => {
        throw handleError(err);
      });
  }
}

const ndbKey = mcconfig.ndb2.clientId;
const ndb2Client = new Ndb2Client(ndbKey);
ndb2Client.initialize();

export default ndb2Client;
