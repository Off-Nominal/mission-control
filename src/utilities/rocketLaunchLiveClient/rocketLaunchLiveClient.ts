import axios from "axios";
import { LaunchesParams, LaunchesResponse } from "./types";

export default class RocketLaunchLiveClient {
  private baseUrl: string = "https://fdo.rocketlaunch.live";

  private fetcher = axios.create({
    headers: {
      Authorization: `Bearer ${process.env.RLL_KEY}`,
    },
  });

  constructor() {
    this.fetcher
      .get("https://fdo.rocketlaunch.live/json/launches")
      .then((res) => console.log(res.data.result));
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
