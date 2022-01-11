import axios from "axios";
import { TextChannel } from "discord.js";
import Fuse from "fuse.js";
const FuseJS = require("fuse.js");

const Watcher = require("feed-watcher");

const defaultProcessor = (item) => item;

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
  rssInterval?: number;
  searchOptions?: Fuse.IFuseOptions<FeedItem>;
};

export class FeedListener extends Watcher {
  channel: TextChannel;
  episodes: FeedItem[];
  title: string;
  fuse: Fuse<FeedItem>;
  searchOptions: Fuse.IFuseOptions<FeedItem> | null;
  processor: (item: any) => FeedItem;

  constructor(feed: string, options?: FeedListenerOptions) {
    super(feed, options.rssInterval || 60);
    this.processor = options.processor || defaultProcessor;
    // this.client = options.discordClient;
    // this.channelId = options.channelId;
    // this.timeout = options.actionDelay * 1000 || 0;
    this.searchOptions = options.searchOptions || null;
    // this.deployUrl = options.deployUrl;
  }

  public async fetchChannel() {
    this.channel = (await this.client.channels.fetch(
      this.channelId
    )) as TextChannel;
  }

  public async initialize() {
    try {
      const entries = await this.start(); // fetch data from RSS
      this.title = entries[0].meta.title; // extract Feed program title
      this.episodes = entries.map(this.processor).reverse(); // map entries from RSS feed to episode format using processor

      console.log(
        `${this.title} feed loaded with ${this.episodes.length} items.`
      );
    } catch (err) {
      console.error(`Error loading ${this.feed}.`);
      console.error(err);
    }

    this.fuse = new FuseJS(this.episodes, this.searchOptions); // start search client
    this.listen(); // listen for new entries on RSS
    this.on("error", console.error);
  }

  private listen() {
    this.on("new entries", (entries) => {
      entries.forEach((episode) => {
        const mappedEpisode = this.processor(episode);
        this.episodes.push(mappedEpisode);
        this.emit("newContent", { feed: this.title, content: mappedEpisode });

        // if (this.deployUrl) {
        //   axios
        //     .post(this.deployUrl)
        //     .catch((err) => console.error("Failed to deploy site.", err));
        // }

        // setTimeout(() => {
        //   this.announceNewItem(mappedEpisode.url);
        // }, this.timeout);
      });
    });
  }

  // private announceNewItem(podcastURL) {
  //   console.log(`New episode in ${this.title}.\n${podcastURL}`);
  //   this.channel
  //     .send({
  //       content: `It's podcast release day for ${this.title}!\n${podcastURL}`,
  //     })
  //     .then(() => {
  //       console.log(
  //         `Discord successfully notified of new podcast episode in ${this.title}`
  //       );
  //     })
  //     .catch((err) => {
  //       console.error(
  //         `Error sending message to Discord for update to ${this.title}`
  //       );
  //       console.error(err);
  //     });
  // }

  public fetchRecent() {
    return this.episodes[this.episodes.length - 1];
  }

  public search(term: string) {
    return this.fuse.search(term);
  }

  public getEpisodeByNumber(ep: number) {
    return this.episodes.find((episode) => {
      const epString = episode.title.split(" ")[0].replace(/\D/g, "");
      return Number(epString) === ep;
    });
  }
}
