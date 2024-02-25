import EventEmitter = require("events");
import axios, { AxiosResponse } from "axios";
import { sub } from "date-fns";
import { GitHubAgent } from "../../providers/github-client";
import mcconfig from "../../mcconfig";

export enum SiteListenerEvents {
  UPDATE = "siteUpdate",
  READY = "ready",
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

export class SiteListener extends EventEmitter {
  //params
  private url: string;
  private cooldown: number = 0;
  private interval: number = 30000;

  //clients
  private gitHubAgent: GitHubAgent;

  //data
  private metadata: { [key: string]: VersionData } = {};
  private logs: ChangeLog[];
  private currentHTML: string;

  //cooldown
  private lastMessage: Date;

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
    // Fetch the tracked site
    // We're going to see if there is a change from our most recently tracked etag
    let response: AxiosResponse<never>;
    try {
      response = await axios.get(this.url);
    } catch (err) {
      console.error(`Request to monitor ${this.url} failed.`);
      console.error(err);
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
      console.log("No new changes detected, etag the same.");
      console.log(newEtag);
      return;
    }

    const html = response.data;
    const lastUpdate = response.headers["last-modified"];
    // Determine if new contents are actually different from the last tracked etag

    console.log("current", this.currentHTML);
    console.log("new", html);
    if (this.currentHTML === html) {
      console.log("No new changes detected.");
      return;
    }

    //Log Change
    console.log(`SiteListener detected a change at ${this.url}`);
    console.log(`New ETag is: ${newEtag}`);

    // Saves change information to Github
    let diffUrl: string;
    try {
      diffUrl = await this.saveChange(newEtag, html, lastUpdate);
    } catch (err) {
      return console.error(err);
    }

    // If there are changes, the checker will either chill from the cooldown or notify the Discord
    if (this.isCoolingDown()) {
      console.log(`SiteListener is in Cooldown mode.`);
    } else {
      try {
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
    const now = new Date();
    const durationSinceLastUpdate = Math.abs(
      now.getTime() - this.lastMessage.getTime()
    );
    return durationSinceLastUpdate < this.cooldown;
  }

  private isNewEtag(newEtag) {
    const index = this.logs.findIndex((log) => log.etag === newEtag);
    return index === -1;
  }

  private async saveChange(etag: string, html: string, lastUpdate: string) {
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
      console.log(response.data);
      diffUrl = response.data.commit.html_url;
    } catch (err) {
      throw err;
    }

    // add to log file
    try {
      const newLogs = [...this.logs];
      newLogs.push({
        etag,
        date: new Date(),
      });

      const filename = "log.json";
      const response = await this.gitHubAgent.updateFile(
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
      const response = await this.gitHubAgent.updateFile(
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
    this.updateMetadata(contents);

    return diffUrl;
  }

  private extractMetadata(response, filename: string) {
    const file = response.find((content) => content.name === filename);
    this.metadata[filename] = {
      sha: file.sha,
      rawUrl: file.download_url,
    };
  }

  private async updateMetadata(contents) {
    this.extractMetadata(contents, "version.json");
    this.extractMetadata(contents, "contents.html");
    this.extractMetadata(contents, "log.json");
  }

  public async initialize() {
    try {
      //Fetches metadata for all the files we need to work with
      const contents = await this.gitHubAgent.getContents(
        mcconfig.siteTracker.starship.owner
      );
      this.updateMetadata(contents);

      const logsResponse = await axios.get(this.metadata["log.json"].rawUrl);
      this.logs = logsResponse.data;

      const contentResponse = await axios.get(
        this.metadata["contents.html"].rawUrl
      );
      this.currentHTML = contentResponse.data;

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
