import { Client, TextChannel } from "discord.js";
import Fuse from "fuse.js";
const FuseJS = require("fuse.js");

const Watcher = require("feed-watcher");

export type FeedItem = {
  title: string;
  date: string;
  url: string;
  audioUrl: string;
  image: string;
  description: string;
};

export type FeedListenerOptions = {
  processor?: (item: any) => FeedItem;
  discordClient: Client;
  channelId: string;
  rssInterval?: number;
  actionDelay?: number;
  searchOptions?: Fuse.IFuseOptions<FeedItem>;
};

export class FeedListener extends Watcher {
  client: Client;
  channel: TextChannel;
  episodes: FeedItem[];
  title: string;
  fuse: Fuse<FeedItem>;
  searchOptions: Fuse.IFuseOptions<FeedItem> | null;

  constructor(feed: string, options?: FeedListenerOptions) {
    super(feed, options.rssInterval || 60);
    this.processor = options.processor || null;
    this.client = options.discordClient;
    this.channelId = options.channelId;
    this.timeout = options.actionDelay * 1000 || 0;
    this.searchOptions = options.searchOptions || null;
  }

  private processRSS(entries) {
    if (this.processor) {
      this.episodes = entries.map(this.processor).reverse();
    } else {
      this.episodes = entries.reverse();
    }
  }

  public async fetchChannel() {
    const channel = (await this.client.channels.fetch(
      this.channelId
    )) as TextChannel;
    this.channel = channel;
  }

  private initializeSearch() {
    this.fuse = new FuseJS(this.episodes, this.searchOptions);
  }

  public async initialize() {
    try {
      const entries = await this.start();
      this.title = entries[0].meta.title;

      this.processRSS(entries);

      console.log(
        `${this.title} feed loaded with ${this.episodes.length} items.`
      );
    } catch (err) {
      console.error(`Error loading ${this.feed}.`);
      console.error(err);
    }

    this.initializeSearch();
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

  public search(term: string) {
    return this.fuse.search(term);
  }
}
