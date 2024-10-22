import axios, { AxiosRequestConfig } from "axios";
import mcconfig from "../../mcconfig";
import bootLogger from "../../logger";
import { LogStatus } from "../../logger/Logger";
import { createAppAuth } from "@octokit/auth-app";
import { Endpoints } from "@octokit/types";

const BASEURL = mcconfig.providers.github.baseUrl;

const OWNER = mcconfig.siteTracker.starship.owner;
const REPO = mcconfig.siteTracker.starship.repo;
const BRANCH = mcconfig.siteTracker.starship.branch;

const config: AxiosRequestConfig = {
  headers: {
    Accept: "application/vnd.github.v3+json",
  },
};

type getContentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/contents/{path}"]["response"];

export class GitHubAgent {
  private token: string = "";
  private authConfig: AxiosRequestConfig = {};

  constructor() {}

  private async authenticate() {
    if (!mcconfig.providers.github.appId) {
      throw new Error("GitHub App Id not found");
    }

    const auth = createAppAuth({
      appId: mcconfig.providers.github.appId,
      privateKey: mcconfig.providers.github.privateKey,
      clientId: mcconfig.providers.github.clientId,
      clientSecret: mcconfig.providers.github.clientSecret,
    });

    try {
      const { token } = await auth({
        type: "installation",
        installationId: mcconfig.providers.github.botInstallId,
      });
      this.token = token;
      this.authConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${this.token}`,
        },
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

  public async getContents(owner: string): Promise<getContentsResponse> {
    const url = `${BASEURL}/repos/${owner}/${REPO}/contents/?ref=${BRANCH}`;
    try {
      const { data } = await axios.get<getContentsResponse>(url, config);
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

const gitHubAgent = new GitHubAgent();

//Authorize Agent with GitHub
gitHubAgent
  .initialize()
  .then(() => {
    bootLogger.addLog(LogStatus.SUCCESS, "GitHub Client Authorized");
    bootLogger.logItemSuccess("githubAgent");
  })
  .catch((err) => {
    console.error(err);
    bootLogger.addLog(LogStatus.FAILURE, "GitHub Client failed to Authorized");
  });

export default gitHubAgent;
