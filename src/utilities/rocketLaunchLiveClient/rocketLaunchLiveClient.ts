import axios, { AxiosInstance } from "axios";
import { add, format } from "date-fns";
import { LaunchesParams, LaunchesResponse } from "./types";

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
      .catch((err) => {
        console.error("RocketLaunchLive Client Error: ", err);
        throw err;
      });
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
    }).then((response) => {
      return response.result;
    });
  }
}
