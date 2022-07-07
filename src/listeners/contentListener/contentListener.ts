import { GuildScheduledEvent } from "discord.js";
import Fuse from "fuse.js";
import { ContentFeedItem } from "../../clients/content/handlers/handleNewContent";
import { ContentListnerEvents } from "../../clients/types";
import { FeedWatcherEvents } from "../feedListener/feedTypes";
import { FeedWatcher } from "../feedListener/feedWatcher";
const FuseJS = require("fuse.js");

const defaultProcessor = (item, showTitle: string) => item;

export type ContentListenerOptions = {
  processor?: (item: any, showTitle: string) => ContentFeedItem;
  rssInterval?: number;
  searchOptions?: Fuse.IFuseOptions<ContentFeedItem>;
};

export class ContentListener extends FeedWatcher {
  episodes: ContentFeedItem[];
  title: string;
  albumArt: string;
  fuse: Fuse<ContentFeedItem>;
  searchOptions: Fuse.IFuseOptions<ContentFeedItem> | null;
  processor: (item: any, showTitle: string) => ContentFeedItem;

  constructor(feedUrl: string, options?: ContentListenerOptions) {
    super(feedUrl, { interval: options.rssInterval });
    this.processor = options.processor || defaultProcessor;
    this.searchOptions = options.searchOptions || null;
    this.verifyEvent = this.verifyEvent.bind(this);
  }

  public async initialize() {
    try {
      const entries = await this.start();
      this.title = entries[0].meta.title; // extract Feed program title
      this.albumArt = entries[0].meta.image.url; // extract Feed program album art
      this.episodes = entries
        .map((entry) => this.processor(entry, this.title))
        .reverse(); // map entries from RSS feed to episode format using processor

      console.log(
        `${this.title} feed loaded with ${this.episodes.length} items.`
      );
      this.on(FeedWatcherEvents.ERROR, (error) =>
        console.error(`Error checking ${this.title}.`, error)
      );
    } catch (err) {
      console.log(
        `Attempted to initialize ${this.title} multiple times, could not fetch data.`
      );
      console.error(err);
    }

    this.fuse = new FuseJS(this.episodes, this.searchOptions); // start search client
    this.listen(); // listen for new entries on RSS
  }

  private listen() {
    this.on(FeedWatcherEvents.NEW, (entries) => {
      entries.forEach((episode) => {
        const mappedEpisode = this.processor(episode, this.title);
        this.episodes.push(mappedEpisode);
        this.emit(ContentListnerEvents.NEW, mappedEpisode);
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

  public getEpisodeByUrl(url: string) {
    return this.episodes.find((episode) => episode.url === url);
  }

  public verifyEvent(event: GuildScheduledEvent<"ACTIVE" | "COMPLETED">) {
    const stream = this.episodes.find(
      (episode) => episode.url === event.entityMetadata?.location
    );

    if (!stream) {
      return;
    }

    if (event.status === "COMPLETED") {
      this.emit(ContentListnerEvents.STREAM_END, event);
    }
    if (event.status === "ACTIVE") {
      this.emit(ContentListnerEvents.STREAM_START, event);
    }
  }
}
