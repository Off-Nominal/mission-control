import axios from "axios";
import { sub } from "date-fns";
import { Client, MessageEmbed, TextChannel } from "discord.js";
import { GitHubAgent } from "./github";
const Discord = require("discord.js");

const OWNER = "mendahu";
const REPO = "starship-site-tracking";
const BRANCH = process.env.STARSHIP_SITE_TRACKER_BRANCH;

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

export class SiteListener {
  //params
  private url: string;
  private cooldown: number = 0;
  private interval: number = 30000;
  private channelId: string;

  //clients
  private discordClient: Client;
  private gitHubAgent: GitHubAgent;

  //data
  private metadata: { [key: string]: VersionData } = {};
  private logs: ChangeLog[];

  //cooldown
  private lastMessage: Date;

  constructor(
    url: string,
    client: Client,
    channelId: string,
    options: SiteListenerOptions
  ) {
    this.url = url;
    this.discordClient = client;
    this.channelId = channelId;

    if (options.interval) {
      this.interval = options.interval * 1000;
    }

    if (options.cooldown) {
      this.cooldown = options.cooldown * 1000;
      this.lastMessage = sub(new Date(), { seconds: options.cooldown }); // default last message to outside cooldown window
    }
  }

  private async checkSite() {
    // Fetch the tracked site's HEAD record
    // We're going to see if there is a change from our most recently tracked etag
    let response;
    try {
      response = await axios.head(this.url);
    } catch (err) {
      console.error(`Request to monitor ${this.url} failed.`);
      console.error(err);
      throw err;
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
    try {
      diffUrl = await this.saveChange(newEtag);
    } catch (err) {
      console.log(err);
      throw err;
    }

    // If there are changes, the checker will either chill from the cooldown or notify the Discord
    if (this.isCoolingDown()) {
      console.log(`SiteListener is in Cooldown mode.`);
    } else {
      try {
        this.notifyChanges(diffUrl, response.headers["last-modified"]);
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

  private async saveChange(etag) {
    // Fetch the HTML in the new update
    let html: string;
    let etagCheck: string;
    let lastUpdate: string;

    try {
      const response = await axios.get(this.url);
      html = response.data;
      etagCheck = response.headers.etag.replace(/"/gi, "");
      lastUpdate = response.headers["last-modified"];
    } catch (err) {
      console.error(err);
    }

    // Check that the GET request's Etag is consistent to the HEAD request we made
    if (etagCheck !== etag) {
      console.log(
        "Etag Mismatch, the GET request and HEAD request are different. Ignoring this change for now."
      );
      throw "Etag mismatch";
    }

    // upload html to contents
    let diffUrl = "";

    try {
      const filename = "contents.html";
      const response = await this.gitHubAgent.updateFile(
        filename,
        this.metadata[filename].sha,
        html
      );
      diffUrl = response.data.commit.html_url;
    } catch (err) {
      console.error(err);
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
        JSON.stringify(newLogs, null, 2)
      );
      this.logs = newLogs;
    } catch (err) {
      console.error(err);
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
        JSON.stringify(newVersion, null, 2)
      );
    } catch (err) {
      console.error(err);
    }

    const contents = await this.gitHubAgent.getContents();
    this.updateMetadata(contents);

    return diffUrl;
  }

  private async notifyChanges(diffUrl: string, date: string) {
    const embed: MessageEmbed = new Discord.MessageEmbed();

    embed
      .setColor("#3e7493")
      .setTitle(`Change detected on Starship's Website`)
      .setDescription(`Change occured at ${date}.`)
      .addFields([
        {
          name: "View",
          value: `[Starship Site](${this.url})`,
          inline: true,
        },
        {
          name: "Compare",
          value: `[Differences](${diffUrl})`,
          inline: true,
        },
        {
          name: "History",
          value: `[Recent Changes](https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/log.json)`,
          inline: true,
        },
      ])
      .setTimestamp();

    try {
      const channel = await this.discordClient.channels.fetch(this.channelId);
      await (channel as TextChannel).send(embed);
      console.log(`Discord successfully notified of changes to ${this.url}`);
    } catch (err) {
      console.error(err);
    }
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

  private async initializeAgent() {
    this.gitHubAgent = new GitHubAgent();

    try {
      //Authorize Agent with GitHub
      await this.gitHubAgent.initialize();

      //Fetches metadata for all the files we need to work with
      const contents = await this.gitHubAgent.getContents();
      this.updateMetadata(contents);

      //Loads log files into memory
      const logsResponse = await axios.get(this.metadata["log.json"].rawUrl);
      this.logs = logsResponse.data;

      console.log("GitHubAgent authorized and ready.");
    } catch (err) {
      throw err;
    }
  }

  public async initialize() {
    try {
      await this.initializeAgent();
      setInterval(() => {
        this.checkSite();
      }, this.interval);
      console.log(`SiteListener now monitoring ${this.url}`);
    } catch (err) {
      console.error(
        "Error initializing GitHub Agent, site tracking is inactive."
      );
      console.error(err);
    }
  }
}
