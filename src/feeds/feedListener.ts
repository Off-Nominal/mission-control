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

  public async fetchChannel() {
    const channel = (await this.client.channels.fetch(
      this.channelId
    )) as TextChannel;
    this.channel = channel;
    console.log(
      `${this.title} Bot is now connected to channel ${this.channel.name}`
    );
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

    this.listen();
    this.error();
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

  private error() {
    this.on("error", (err) => {
      console.error(err);
    });
  }

  private announceNewItem(podcastURL) {
    console.log(`New episode in ${this.title}.\n${podcastURL}`);
    this.channel
      .send(`It's podcast release day for ${this.title}!\n${podcastURL}`)
      .then(() => {
        console.log(
          `Discord successfully notified of new podcast episode in ${this.title}`
        );
      })
      .catch((err) => {
        console.error(
          `Error sending message to Discord for update to ${this.title}`
        );
        console.error(err);
      });
  }

  public fetchRecent() {
    return this.episodes[this.episodes.length - 1];
  }
}
