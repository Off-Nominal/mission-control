import axios from "axios";
import { sub } from "date-fns";
import { Client, MessageEmbed, TextChannel } from "discord.js";
import { GitHubAgent } from "./github";
const Discord = require("discord.js");

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
  date: string;
  commit: string;
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
  private currentEtag: string;
  private lastUpdate: string;
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
    const newEtag = response.headers.etag;
    const isNewEtag = this.isNewEtag(newEtag);

    // No new changes, short circuit
    if (!isNewEtag) {
      return;
    }

    // If there are changes, the checker will either chill from the cooldown or notify the Discord
    if (this.isCoolingDown()) {
      console.log(
        `SiteListener is in Cooldown mode and will report all changes after cooldown period.`
      );
    } else {
      console.log(`SiteListener detected a change at ${this.url}`);
      console.log(`New ETag is: ${newEtag}`);
      // this.notifyChanges(newEtag);
      this.saveChange(newEtag);
      this.lastMessage = new Date(); // Tracks time for cooldown purposes
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

    try {
      const response = await axios.get(this.url);
      html = response.data;
      etagCheck = response.headers.etag;
    } catch (err) {
      console.error(err);
    }

    // Check that the GET request's Etag is consistent to the HEAD request we made
    if (etagCheck !== etag) {
      return console.log(
        "Etag Mismatch, the GET request and HEAD request are different. Ignoring this change for now."
      );
    }

    // upload html to contents
    // add to log file
    // update version file
  }

  // private async notifyChanges(etag: string) {
  //   const embed: MessageEmbed = new Discord.MessageEmbed();

  //   embed
  //     .setColor("#3e7493")
  //     .setTitle(`Alert!`)
  //     .setDescription(
  //       `I have detected a change to [Starship's Website](${this.url}).`
  //     )
  //     .addField("New Etag Value:", etag)
  //     .setTimestamp();

  //   try {
  //     const channel = await this.client.channels.fetch(this.channelId);
  //     await (channel as TextChannel).send(embed);
  //     console.log(`Discord successfully notified of changes to ${this.url}`);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  private extractMetadata(response, filename: string) {
    const file = response.find((content) => content.name === filename);
    this.metadata[filename] = {
      sha: file.sha,
      rawUrl: file.download_url,
    };
  }

  private async initializeAgent() {
    this.gitHubAgent = new GitHubAgent();

    try {
      //Authorize Agent with GitHub
      await this.gitHubAgent.initialize();
      console.log("GitHubAgent authorized and ready.");

      //Fetches metadata for all the files we need to work with
      const contents = await this.gitHubAgent.getContents();
      this.extractMetadata(contents, "version.json");
      this.extractMetadata(contents, "contents.html");
      this.extractMetadata(contents, "log.json");
      console.log("Github Repo Files logged.");

      //Fetches most recently tracked etag from GitHub
      const versionResponse = await axios.get(
        this.metadata["version.json"].rawUrl
      );
      this.currentEtag = versionResponse.data.etag;
      this.lastUpdate = versionResponse.data.lastUpdate;
      console.log(`Tracking from etag ${this.currentEtag}`);

      //Loads log files into memory
      const logsResponse = await axios.get(this.metadata["log.json"].rawUrl);
      this.logs = logsResponse.data;
      console.log("Logs loaded into memory");
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
