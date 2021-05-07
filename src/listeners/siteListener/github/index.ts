const { createAppAuth } = require("@octokit/auth-app");
import axios, { AxiosRequestConfig } from "axios";

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
  private authConfig: AxiosRequestConfig;

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
      this.token = token;
      this.authConfig = {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${this.token}` },
      };
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
    const url = `${BASEURL}/repos/${OWNER}/${REPO}/contents/?ref=${BRANCH}`;
    try {
      const { data } = await axios.get(url, config);
      return data;
    } catch (err) {
      throw err;
    }
  }

  public async updateFile(
    filename: string,
    sha: string,
    contents: string,
    etag: string
  ) {
    const url = `${BASEURL}/repos/${OWNER}/${REPO}/contents/${filename}`;

    try {
      const file = Buffer.from(contents).toString("base64");

      const body = {
        message: `update ${filename} - ETag ${etag}`,
        content: file,
        branch: BRANCH,
        sha,
      };

      const response = await axios.put(url, body, this.authConfig);

      return response;
    } catch (err) {
      throw err;
    }
  }
}
