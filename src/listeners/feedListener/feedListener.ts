import Fuse from "fuse.js";
const FuseJS = require("fuse.js");
const Watcher = require("feed-watcher");

const FEED_CHECK_TIME_IN_SECONDS = 60;
const defaultProcessor = (item) => item;

export type FeedItem = {
  title: string;
  date: Date;
  url: string;
  audioUrl?: string;
  image: string;
  description?: string;
  summary: string;
};

export type FeedListenerOptions = {
  processor?: (item: any) => FeedItem;
  rssInterval?: number;
  searchOptions?: Fuse.IFuseOptions<FeedItem>;
};

export class FeedListener extends Watcher {
  episodes: FeedItem[];
  title: string;
  albumArt: string;
  fuse: Fuse<FeedItem>;
  searchOptions: Fuse.IFuseOptions<FeedItem> | null;
  processor: (item: any) => FeedItem;

  constructor(feed: string, options?: FeedListenerOptions) {
    super(feed, options.rssInterval || FEED_CHECK_TIME_IN_SECONDS);
    this.processor = options.processor || defaultProcessor;
    this.searchOptions = options.searchOptions || null;
  }

  public async initialize() {
    try {
      const entries = await this.start(); // fetch data from RSS
      this.title = entries[0].meta.title; // extract Feed program title
      this.albumArt = entries[0].meta.image.url;
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
      });
    });
  }

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
