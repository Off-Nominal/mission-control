import { GuildScheduledEvent, GuildScheduledEventStatus } from "discord.js";
import Fuse from "fuse.js";
import { ContentFeedItem } from "../../../actions/post-to-content-channel";
import { FeedParserEntry, FeedWatcherEvents } from "../FeedWatcher/types";
import { FeedWatcher } from "../FeedWatcher";
import { formatFeedError } from "../FeedWatcher/errors";
const FuseJS = require("fuse.js");

const defaultProcessor = (item, showTitle: string) => item;

export enum ContentListenerEvents {
  NEW = "newContent",
  READY = "ready",
  // Not "error": emitting that name with no listener exits the process.
  ERROR = "contentFeedError",
}

export type ContentListenerOptions = {
  processor?: (item: any, showTitle: string) => ContentFeedItem;
  rssInterval?: number;
  searchOptions?: Fuse.IFuseOptions<ContentFeedItem>;
  attempts?: number;
  retryTime?: number;
  fetch?: () => Promise<FeedParserEntry[]>;
};

export class ContentListener extends FeedWatcher {
  private episodes: ContentFeedItem[] = [];
  public title: string | null = null;
  public albumArt: string | undefined = undefined;
  private fuse: Fuse<ContentFeedItem> | undefined;
  searchOptions: Fuse.IFuseOptions<ContentFeedItem> | null;
  processor: (item: any, showTitle: string) => ContentFeedItem;

  private initialLoadAttached = false;

  constructor(feedUrl: string, options?: ContentListenerOptions) {
    super(feedUrl, {
      interval: options?.rssInterval,
      attempts: options?.attempts,
      retryTime: options?.retryTime,
      fetch: options?.fetch,
      // A show feed that is still down keeps polling and does not fail boot.
      pollAfterFailedStart: true,
    });
    this.processor = options?.processor || defaultProcessor;
    this.searchOptions = options?.searchOptions || null;
    this.isStream = this.isStream.bind(this);
  }

  private attachInitialLoad() {
    if (this.initialLoadAttached) return;
    this.initialLoadAttached = true;
    this.on(FeedWatcherEvents.INITIAL, (entries: FeedParserEntry[]) => {
      try {
        this.finishLoad(entries);
      } catch (err) {
        console.error(
          `Could not fetch content feed: ${formatFeedError(err)}`,
        );
      }
    });
  }

  private finishLoad(entries: FeedParserEntry[]) {
    if (this.fuse) return;
    this.title = entries[0].meta.title; // extract Feed program title
    this.albumArt = entries[0].meta.image.url; // extract Feed program album art
    this.episodes = entries
      .map((entry) => this.processor(entry, this.title))
      .reverse(); // map entries from RSS feed to episode format using processor
    this.fuse = new FuseJS(this.episodes, this.searchOptions); // start search client
    this.emit(
      ContentListenerEvents.READY,
      `${this.title} feed loaded with ${this.episodes.length} items.`,
    );
    this.on(FeedWatcherEvents.ERROR, (error) =>
      console.error(`Error checking ${this.title}: ${formatFeedError(error)}`),
    );
    this.listen(); // listen for new entries on RSS
  }

  public async initialize() {
    this.attachInitialLoad();
    try {
      const entries = await this.start();
      this.finishLoad(entries);
    } catch (err) {
      const detail = formatFeedError(err);
      this.emit(
        ContentListenerEvents.ERROR,
        `Could not fetch content feed: ${detail}`,
      );
      console.error(`Could not fetch content feed: ${detail}`);
      if (this.recoveryPolling) {
        console.error(
          `Content feed will keep checking in the background: ${this.feedurl}`,
        );
        return;
      }
      throw err;
    }
  }

  private listen() {
    this.on(FeedWatcherEvents.NEW, (entries) => {
      entries.forEach((episode) => {
        const mappedEpisode = this.processor(episode, this.title);
        this.episodes.push(mappedEpisode);
        this.emit(ContentListenerEvents.NEW, mappedEpisode);
      });
    });
  }

  public hasLoaded(): boolean {
    return this.fuse != null;
  }

  public fetchRecent() {
    return this.episodes[this.episodes.length - 1];
  }

  public search(term: string) {
    if (!this.fuse) return [];
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

  public isStream(
    event: GuildScheduledEvent<GuildScheduledEventStatus>
  ): boolean {
    const stream = this.getEpisodeByUrl(event.entityMetadata.location);

    return !!stream;
  }
}
