import axios from "axios";
import { sub } from "date-fns";
import { Client, MessageEmbed, TextChannel } from "discord.js";
const Discord = require("discord.js");

export type SiteListenerOptions = {
  interval?: number;
  cooldown?: number;
};

export class SiteListener {
  url: string;
  cooldown: number = 0;
  interval: number = 30000;
  trackedTags: string[] = [];
  client: Client;
  channelId: string;
  lastUpdate: Date;

  constructor(
    url: string,
    client: Client,
    channelId: string,
    options: SiteListenerOptions
  ) {
    this.url = url;
    this.client = client;
    this.channelId = channelId;

    if (options.interval) {
      this.interval = options.interval * 1000;
    }

    if (options.cooldown) {
      this.cooldown = options.cooldown * 1000;
    }

    this.lastUpdate = sub(new Date(), { seconds: this.cooldown / 1000 + 1 });
  }

  private async checkSite() {
    // Fetch the tracked site's HEAD record
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

    // Short circuit for initial boot - sets initial etag to baseline from
    if (!this.trackedTags.length) {
      this.saveChange(newEtag);
      return console.log(`Initial ETag is ${newEtag}`);
    }

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
      this.notifyChanges();
      this.saveChange(newEtag); // Adds tag to list of tracked tags so it doesn't notify again
      this.lastUpdate = new Date(); // Tracks time for cooldown purposes
    }
  }

  private isCoolingDown() {
    const now = new Date();
    const durationSinceLastUpdate = Math.abs(
      now.getTime() - this.lastUpdate.getTime()
    );
    return durationSinceLastUpdate < this.cooldown;
  }

  private isNewEtag(newEtag) {
    return !this.trackedTags.includes(newEtag);
  }

  private saveChange(etag) {
    this.trackedTags.push(etag);
  }

  private async notifyChanges() {
    const embed: MessageEmbed = new Discord.MessageEmbed();

    embed
      .setColor("#3e7493")
      .setTitle(`Alert!`)
      .setDescription(
        `I have detected a change to [Starship's Website](${this.url}).`
      )
      .addField(
        "New Etag Value:",
        this.trackedTags[this.trackedTags.length - 1]
      )
      .setTimestamp();

    try {
      const channel = await this.client.channels.fetch(this.channelId);
      await (channel as TextChannel).send(embed);
      console.log(`Discord successfully notified of changes to ${this.url}`);
    } catch (err) {
      console.error(err);
    }
  }

  public initialize() {
    setInterval(() => {
      this.checkSite();
    }, this.interval);
    console.log(`SiteListener now monitoring ${this.url}`);
  }
}
