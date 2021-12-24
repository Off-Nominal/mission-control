import { Message } from "discord.js";
const axios = require("axios");

const BASEURL = process.env.BASEURL;

export enum RecommendCommand {
  random = "random",
  highestrated = "highestrate",
  favourite = "favourite",
}

export const getRecommendation = async (arg: RecommendCommand) => {
  const fetchRecommend = (type: RecommendCommand) => {
    return axios
      .get(`${BASEURL}/api/recommendations?type=${type}`)
      .then((response) => response.data[0].slug);
  };

  return await fetchRecommend(arg);
};
