import { Client, TextChannel } from "discord.js";

const Watcher = require("feed-watcher");

export type FeedItem = {
  title: string;
  date: string;
  url: string;
  audioUrl: string;
  image: string;
};

export class FeedListener extends Watcher {
  client: Client;
  channel: TextChannel;
  episodes: FeedItem[];
  title: string;

  constructor(
    feed: string,
    processor: (item: any) => FeedItem,
    client: Client,
    channelId: string,
    timeout: number = 0
  ) {
    super(feed, 60);
    this.processor = processor;
    this.client = client;
    this.channelId = channelId;
    this.timeout = timeout;
  }

  private async fetchChannel() {
    return (await this.client.channels.fetch(this.channelId)) as TextChannel;
  }

  public async initialize() {
    try {
      const entries = await this.start();
      this.episodes = entries.map(this.processor).reverse();
      this.title = entries[0].meta.title;
      console.log(`${this.title} feed has been loaded.`);
      console.log(
        `${this.title} feed length is ${this.episodes.length} items.`
      );
    } catch (err) {
      console.error("Error loading the feed.");
      console.error(err);
    }

    try {
      const channel = await this.fetchChannel();
      this.channel = channel;
    } catch (err) {
      console.error(err);
    }

    this.listen();
  }

  private listen() {
    this.on("new entries", (entries) => {
      entries.forEach((episode) => {
        const mappedEpisode = this.processor(episode);
        this.episodes.push(mappedEpisode);
        setTimeout(() => {
          this.announceNewItem(mappedEpisode.url);
        }, this.timeout);
      });
    });
  }

  private announceNewItem(podcastURL) {
    console.log(`New episode in ${this.title}.\n${podcastURL}`);
    this.channel.send(
      `It's podcast release day for ${this.title}!\n${podcastURL}`
    );
  }
}
