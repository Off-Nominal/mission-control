import axios, { AxiosInstance } from "axios";
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
    url.pathname = "/json/launches";
    const params = new URLSearchParams(options);
    url.search = params.toString();

    return this.fetcher
      .get<LaunchesResponse>(url.toString())
      .then((res) => res.data.result);
  }
}
