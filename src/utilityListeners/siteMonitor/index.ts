import axios from "axios";
import { sub } from "date-fns";
import { Client, MessageEmbed, TextChannel } from "discord.js";
const Discord = require("discord.js");

export type SiteMonitorOptions = {
  interval?: number;
  cooldown?: number;
};

export class SiteMonitor {
  url: string;
  etag: string = "";
  cooldown: number = 0;
  interval: number = 30000;
  changes: string[] = [];
  client: Client;
  channelId: string;
  lastUpdate: Date;

  constructor(
    url: string,
    client: Client,
    channelId: string,
    options: SiteMonitorOptions
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
    let response;

    try {
      response = await axios.head(this.url);
    } catch (err) {
      console.error(`Request to monitor ${this.url} failed.`);
      console.error(err);
      throw err;
    }

    const newEtag = response.headers.etag;
    const isNewEtag = this.compareEtag(newEtag);

    if (this.etag === "") {
      this.etag = newEtag;
      return console.log(`Initial ETag is ${this.etag}`);
    }

    if (isNewEtag) {
      console.log(`SiteMonitor detected a change at ${this.url}`);
      console.log(`New ETag is: ${newEtag}`);
      this.saveChange(newEtag);
    }

    const unreportedChanges = !!this.changes.length;
    const isCoolingDown = this.isCoolingDown();

    if (!unreportedChanges) {
      return;
    }

    if (isCoolingDown) {
      if (isNewEtag) {
        console.log(
          `SiteMonitor is in Cooldown mode and will report all changes after cooldown period.`
        );
      }
    } else {
      this.notifyChanges();
    }
  }

  private isCoolingDown() {
    const now = new Date();
    const durationSinceLastUpdate = Math.abs(
      now.getTime() - this.lastUpdate.getTime()
    );
    return durationSinceLastUpdate < this.cooldown;
  }

  private compareEtag(newEtag) {
    return newEtag !== this.etag;
  }

  private saveChange(etag) {
    this.changes.push(etag);
    this.etag = etag;
  }

  private async notifyChanges() {
    const embed: MessageEmbed = new Discord.MessageEmbed();

    const fields = this.changes.join("\n");

    embed
      .setColor("#3e7493")
      .setTitle(`Alert!`)
      .setDescription(
        `SpaceX has made ${this.changes.length} changes to the Starship section of their website since the last time I reported.`
      )
      .addField(
        "Site ETag Version Number changes since last notification. These will be gibberish but might help Jake if there is another hostile bot takeover.",
        fields
      )
      .setTimestamp()
      .setURL(this.url);

    try {
      const channel = await this.client.channels.fetch(this.channelId);
      await (channel as TextChannel).send(embed);
      console.log(`Discord successfully notified of changes to ${this.url}`);
      this.changes = [];
      this.lastUpdate = new Date();
    } catch (err) {
      console.error(err);
    }
  }

  public initialize() {
    setInterval(() => {
      this.checkSite();
    }, this.interval);
    console.log(`SiteMonitor now monitoring ${this.url}`);
  }
}
