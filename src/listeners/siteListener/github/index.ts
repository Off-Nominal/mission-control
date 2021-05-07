const { createAppAuth } = require("@octokit/auth-app");
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { version } from "string-strip-html";

const BASEURL = "https://api.github.com";
const OWNER = "mendahu";
const REPO = "starship-site-tracking";
const BRANCH = process.env.STARSHIP_SITE_TRACKER_BRANCH;

const config: AxiosRequestConfig = {
  headers: {
    Accept: "application/vnd.github.v3+json",
  },
};

export class GitHubAgent {
  private token: string;

  constructor() {}

  private async authenticate() {
    const auth = createAppAuth({
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    });

    try {
      const { token } = await auth({
        type: "installation",
        installationId: process.env.BOT_INSTALL_ID,
      });
      this.token;
    } catch (err) {
      throw err;
    }
  }

  public async initialize() {
    try {
      await this.authenticate();
    } catch (err) {
      throw err;
    }
  }

  public async getContents() {
    const url = `${BASEURL}/repos/${OWNER}/${REPO}/contents`;
    try {
      const { data } = await axios.get(url, config);
      return data;
    } catch (err) {
      throw err;
    }
  }

  public async updateFile() {
    const url = `${BASEURL}/repos/${OWNER}/${REPO}/contents`;

    try {
      const response = await axios.put(url, config);
    } catch (err) {
      throw err;
    }
  }
}
