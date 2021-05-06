import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const BASEURL = "https://api.github.com";
const OWNER = "mendahu";
const REPO = "starship-site-tracking";
const BRANCH = "master";

const headers: AxiosRequestConfig = {
  headers: {
    Accept: "application/vnd.github.v3+json",
  },
};

export const getHead = async () => {
  const apiUrl = `${BASEURL}/repos/${OWNER}/${REPO}/git/matching-refs/heads/${BRANCH}`;

  let response: AxiosResponse<any>;

  try {
    response = await axios.get(apiUrl, headers);
  } catch (err) {
    console.error(err);
    throw err;
  }

  const {
    object: { sha, url },
  } = response.data[0];

  return { sha, url };
};
