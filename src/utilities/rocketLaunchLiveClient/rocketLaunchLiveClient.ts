import axios, { AxiosError, AxiosInstance } from "axios";
import { add, format } from "date-fns";
import { LaunchesParams, LaunchesResponse } from "./types";

type RLLError = {
  type: "Server Responded" | "No Response from Server" | "other";
  status?: AxiosError["response"]["status"];
  axiosCode?: AxiosError["code"];
  method?: string;
  url?: string;
  name?: string;
  message?: string;
};

const axiosErrorHandler = (err: Error | AxiosError) => {
  console.error("RocketLaunchLive Client Error: ", err);
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const error: RLLError = {
        type: "Server Responded",
        status: err.response.status,
        message: err.response.statusText,
        axiosCode: err.code,
        method: err.config.method,
        url: err.config.url,
      };

      throw error;
    } else {
      const error: RLLError = {
        type: "No Response from Server",
        axiosCode: err.code,
        method: err.config.method,
        url: err.config.url,
      };

      throw error;
    }
  } else {
    const error: RLLError = {
      type: "other",
      name: err.name,
      message: err.message,
    };

    throw error;
  }
};

export default class RocketLaunchLiveClient {
  private baseUrl: string = "https://fdo.rocketlaunch.live";
  private fetcher: AxiosInstance;

  constructor(key) {
    this.fetcher = axios.create({
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  }

  public fetchLaunches(options: LaunchesParams) {
    const url = new URL(this.baseUrl);
    const params = new URLSearchParams(options);

    url.pathname = "/json/launches";
    url.search = params.toString();

    return this.fetcher
      .get<LaunchesResponse>(url.toString())
      .then((res) => res.data)
      .catch(axiosErrorHandler);
  }

  public fetchLaunchesInWindow(
    startDate: Date,
    time: {
      years?: number;
      months?: number;
      weeks?: number;
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    }
  ) {
    const window = add(startDate, time);

    return this.fetchLaunches({
      before_date: format(window, "yyyy-MM-dd"),
      after_date: format(startDate, "yyyy-MM-dd"),
    });
  }
}
