import axios from "axios";

export default class RocketLaunchLiveClient {
  private fetcher = axios.create({
    baseURL: "https://fdo.rocketlaunch.live/json",
    headers: {
      Authorization: `Bearer ${process.env.RLL_KEY}`,
    },
  });

  constructor() {
    //
  }

  public fetchLaunches() {
    return this.fetcher
      .get("/launches")
      .then((res) => res.data)
      .catch((err) => console.error(err));
  }
}
