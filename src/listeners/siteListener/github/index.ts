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

export type VersionData = {
  sha: string;
  rawUrl: string;
};

export class GitHubAgent {
  private token: string;
  private metadata: { [key: string]: VersionData } = {};
  private currentEtag: string;

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

  private extractMetadata(response, filename: string) {
    const file = response.find((content) => content.name === filename);
    this.metadata[filename] = {
      sha: file.sha,
      rawUrl: file.download_url,
    };
  }

  private async fetchFiles() {
    try {
      const url = `${BASEURL}/repos/${OWNER}/${REPO}/contents`;
      const { data } = await axios.get(url, config);

      this.extractMetadata(data, "version.json");
      this.extractMetadata(data, "contents.html");
    } catch (err) {
      throw err;
    }
  }

  private async getCurrentEtag() {
    try {
      const response = await axios.get(this.metadata["version.json"].rawUrl);
      const { data } = response;
      this.currentEtag = data.etag;
    } catch (err) {
      throw err;
    }
  }

  private async updateFiles() {}

  public async initialize() {
    try {
      await this.authenticate();
      console.log("GitHubAgent authorized and ready.");
      await this.fetchFiles();
      console.log("Github Repo Files logged.");
      await this.getCurrentEtag();
      console.log(`Tracking from etag ${this.currentEtag}`);
    } catch (err) {
      console.error(err);
    }
  }
}
