import EventEmitter from "node:events";
import axios, { AxiosResponse, isAxiosError } from "axios";
import { sub } from "date-fns";
import { GitHubAgent } from "../../providers/github-client/index.js";
import mcconfig from "../../mcconfig";

export enum SiteListenerEvents {
  UPDATE = "siteUpdate",
  READY = "ready",
  ERROR = "error",
}

export type SiteListenerOptions = {
  interval?: number;
  cooldown?: number;
};

export type VersionData = {
  sha: string;
  rawUrl: string;
};

export type ChangeLog = {
  etag: string;
  date: Date;
};

export type GithubUpdateEmbedData = {
  date: Date;
  url: string;
  diffUrl: string;
};

interface GitHubContents {
  sha: string;
  name: string;
  download_url: string;
}

export class SiteListener extends EventEmitter {
  //params
  private url: string;
  private cooldown: number = 0;
  private interval: number = 30000;

  //clients
  private gitHubAgent: GitHubAgent;

  //data
  private metadata: { [key: string]: VersionData } = {};
  private logs: ChangeLog[] = [];
  private html: string = "";

  //cooldown
  private lastMessage: Date | null = null;
  private rateLimited = false;

  constructor(
    url: string,
    gitHubAgent: GitHubAgent,
    options: SiteListenerOptions
  ) {
    super();
    this.url = url;
    this.gitHubAgent = gitHubAgent;

    if (options.interval) {
      this.interval = options.interval * 1000;
    }

    if (options.cooldown) {
      this.cooldown = options.cooldown * 1000;
      this.lastMessage = sub(new Date(), { seconds: options.cooldown }); // default last message to outside cooldown window
    }
  }

  private async checkSite() {
    if (this.rateLimited) {
      return;
    }

    // We're going to see if there is a change from our most recently tracked etag
    let response: AxiosResponse<never>;
    try {
      response = await axios.get(this.url);
    } catch (err) {
      console.error(`Request to monitor ${this.url} failed.`);
      if (isAxiosError(err) && err.response) {
        if (err.response.status === 429) {
          // pause checks for 5 minutes
          this.rateLimited = true;
          setTimeout(() => {
            this.rateLimited = false;
          }, 300000);

          this.emit(
            SiteListenerEvents.ERROR,
            "Rate Limit Exceeded on Starship Site Check."
          );
        }
      } else {
        console.error(err);
      }
      return;
    }

    if (!response.headers.etag) {
      console.log("ETAG not found in response.");
      return;
    }

    // Determine if the current eTag is different from the most recent one we've tracked
    const newEtag = response.headers.etag.replace(/"/gi, "");
    const isNewEtag = this.isNewEtag(newEtag);

    // No new changes, short circuit
    if (!isNewEtag) {
      return;
    }

    //Log Change
    console.log(`SiteListener detected a change at ${this.url}`);
    console.log(`New ETag is: ${newEtag}`);

    // Saves change information to Github
    let diffUrl: string;
    let shouldTriggerUpdate: boolean;
    try {
      const res = await this.saveChange(response);
      if (typeof res[0] !== "string" || typeof res[1] !== "boolean") {
        throw new Error("Invalid response from saveChange");
      }
      diffUrl = res[0];
      shouldTriggerUpdate = res[1];
    } catch (err) {
      return console.error(err);
    }

    // If there are changes, the checker will either chill from the cooldown or notify the Discord
    if (this.isCoolingDown()) {
      console.log(`SiteListener is in Cooldown mode.`);
    } else {
      try {
        if (!shouldTriggerUpdate) {
          console.log("no difference in HTML, shorting");
          return;
        }
        const updateData: GithubUpdateEmbedData = {
          url: this.url,
          diffUrl,
          date: new Date(response.headers["last-modified"]),
        };
        this.emit(SiteListenerEvents.UPDATE, updateData);
        this.lastMessage = new Date(); // Tracks time for cooldown purposes
      } catch (err) {
        console.error(err);
      }
    }
  }

  private isCoolingDown() {
    if (!this.lastMessage) {
      return false;
    }

    const now = new Date();
    const durationSinceLastUpdate = Math.abs(
      now.getTime() - this.lastMessage.getTime()
    );
    return durationSinceLastUpdate < this.cooldown;
  }

  private isNewEtag(newEtag: any) {
    if (typeof newEtag !== "string") {
      return false;
    }
    const index = this.logs.findIndex((log) => log.etag === newEtag);
    return index === -1;
  }

  private async saveChange(response: AxiosResponse<never>) {
    // Fetch the HTML in the new update
    const html = response.data;
    const etag = response.headers.etag.replace(/"/gi, "");
    const lastUpdate = response.headers["last-modified"];

    // upload html to contents
    let diffUrl = "";

    try {
      const filename = "contents.html";
      const response = await this.gitHubAgent.updateFile(
        filename,
        this.metadata[filename].sha,
        html,
        etag
      );
      diffUrl = response.data.commit.html_url;
    } catch (err) {
      throw err;
    }

    const shouldTriggerUpdate = html !== this.html;
    if (shouldTriggerUpdate) {
      this.html = html;
    }

    // add to log file
    try {
      const newLogs = [...this.logs];
      newLogs.push({
        etag,
        date: new Date(),
      });

      const filename = "log.json";
      await this.gitHubAgent.updateFile(
        filename,
        this.metadata[filename].sha,
        JSON.stringify(newLogs, null, 2),
        etag
      );
      this.logs = newLogs;
    } catch (err) {
      throw err;
    }

    // update version file
    try {
      const newVersion = {
        etag,
        lastUpdate,
      };
      const filename = "version.json";
      await this.gitHubAgent.updateFile(
        filename,
        this.metadata[filename].sha,
        JSON.stringify(newVersion, null, 2),
        etag
      );
    } catch (err) {
      throw err;
    }

    const contents = await this.gitHubAgent.getContents(
      mcconfig.siteTracker.starship.owner
    );
    if (!Array.isArray(contents)) {
      throw new Error("Invalid response from getContents");
    }
    this.updateMetadata(contents);

    return [diffUrl, shouldTriggerUpdate];
  }

  private extractMetadata(response: GitHubContents[], filename: string) {
    const file = response.find((content) => content.name === filename);
    if (!file) {
      throw new Error(`File ${filename} not found in response.`);
    }
    this.metadata[filename] = {
      sha: file.sha,
      rawUrl: file.download_url,
    };
  }

  private async updateMetadata(contents: GitHubContents[]) {
    this.extractMetadata(contents, "version.json");
    this.extractMetadata(contents, "contents.html");
    this.extractMetadata(contents, "log.json");
  }

  private async setCurrentHTML(contents: GitHubContents[]) {
    const file = contents.find((content) => content.name === "contents.html");
    if (!file) {
      throw new Error("File contents.html not found in response.");
    }
    const html = await axios.get(file.download_url).then((res) => res.data);
    this.html = html;
  }

  public async initialize() {
    try {
      //Fetches metadata for all the files we need to work with
      const contents = await this.gitHubAgent.getContents(
        mcconfig.siteTracker.starship.owner
      );
      if (!Array.isArray(contents)) {
        throw new Error("Invalid response from getContents");
      }
      this.updateMetadata(contents);
      this.setCurrentHTML(contents);

      const logsResponse = await axios.get(this.metadata["log.json"].rawUrl);
      this.logs = logsResponse.data;

      setInterval(() => {
        this.checkSite();
      }, this.interval);
      this.emit(SiteListenerEvents.READY);
    } catch (err) {
      console.error(
        "Error initializing Site Tracker, site tracking is inactive."
      );
      console.error(err);
    }
  }
}
