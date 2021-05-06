import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const BASEURL = "https://api.github.com";
const OWNER = "mendahu";
const REPO = "starship-site-tracking";
const BRANCH = process.env.STARSHIP_SITE_TRACKER_BRANCH;

const config: AxiosRequestConfig = {
  headers: {
    Accept: "application/vnd.github.v3+json",
  },
};

export const getHead = async () => {
  const apiUrl = `${BASEURL}/repos/${OWNER}/${REPO}/git/matching-refs/heads/${BRANCH}`;

  let response: AxiosResponse<any>;

  try {
    response = await axios.get(apiUrl, config);
  } catch (err) {
    console.error(err);
    throw err;
  }

  const {
    object: { sha, url },
  } = response.data[0];

  return { sha, url };
};

export const getHeadCommit = async (apiUrl: string) => {
  let response: AxiosResponse<any>;

  try {
    response = await axios.get(apiUrl, config);
  } catch (err) {
    console.error(err);
    throw err;
  }

  const {
    tree: { sha, url },
  } = response.data;

  return { sha, url };
};

export const postFile = async (token: string) => {
  const url = `${BASEURL}/repos/${OWNER}/${REPO}/contents/`;

  const body = {
    message: "test commit",
    content: "test content",
    branch: BRANCH,
  };
  try {
    const response = await axios.put(url, body, {
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
    });
    console.log(response);
  } catch (err) {
    throw err;
  }
};
