import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContentListener, ContentListenerEvents } from "../ContentListener";
import { FeedWatcher } from "./index";
import { FeedParserEntry, FeedWatcherEvents } from "./types";

function axios404() {
  const error = new Error("Request failed with status code 404") as Error & {
    isAxiosError: boolean;
    response: { status: number; statusText: string };
    config: { url: string };
  };
  error.isAxiosError = true;
  error.response = { status: 404, statusText: "Not Found" };
  error.config = {
    url: "https://www.youtube.com/feeds/videos.xml?playlist_id=test",
  };
  return error;
}

function episode(iso: string, link: string): FeedParserEntry {
  return {
    pubDate: new Date(iso),
    link,
    meta: {
      title: "Happy Hour",
      image: { url: "https://example.com/art.jpg" },
    },
  } as FeedParserEntry;
}

class ExposedWatcher extends FeedWatcher {
  scheduled: { delayMs: number; repeating: boolean }[] = [];

  protected arm(delayMs: number, repeating: boolean) {
    this.scheduled.push({ delayMs, repeating });
    super.arm(delayMs, repeating);
  }

  pollNow() {
    return this.poll();
  }
}

class PollableShow extends ContentListener {
  pollNow() {
    return this.poll();
  }
}

describe("feed startup", () => {
  it("retries a 404 instead of stopping on the first response", async () => {
    let calls = 0;
    const watcher = new FeedWatcher("https://example.com/feed", {
      attempts: 3,
      retryTime: 0,
      fetch: () => {
        calls += 1;
        if (calls < 3) return Promise.reject(axios404());
        return Promise.resolve([episode("2026-11-15T00:00:00Z", "https://example.com/3")]);
      },
    });

    try {
      const entries = await watcher.start();
      assert.equal(calls, 3);
      assert.equal(entries[0].link, "https://example.com/3");
    } finally {
      watcher.stop();
    }
  });

  it("arms the backoff poll after startup attempts are spent", async () => {
    const watcher = new ExposedWatcher("https://example.com/feed", {
      attempts: 3,
      retryTime: 0,
      interval: 60,
      pollAfterFailedStart: true,
      fetch: () => Promise.reject(axios404()),
    });

    try {
      await assert.rejects(() => watcher.start(), /404/);
      assert.deepEqual(watcher.scheduled, [
        { delayMs: 5 * 60 * 1000, repeating: false },
      ]);
    } finally {
      watcher.stop();
    }
  });

  it("does not keep polling when recovery was not requested", async () => {
    const watcher = new ExposedWatcher("https://example.com/feed", {
      attempts: 1,
      retryTime: 0,
      fetch: () => Promise.reject(axios404()),
    });

    try {
      await assert.rejects(() => watcher.start(), /404/);
      assert.deepEqual(watcher.scheduled, []);
    } finally {
      watcher.stop();
    }
  });

  it("treats the first successful poll as the initial load", async () => {
    let fail = true;
    const watcher = new ExposedWatcher("https://example.com/feed", {
      attempts: 1,
      retryTime: 0,
      interval: 60,
      pollAfterFailedStart: true,
      fetch: () =>
        fail
          ? Promise.reject(axios404())
          : Promise.resolve([
              episode("2026-11-15T00:00:00Z", "https://example.com/first"),
            ]),
    });
    const initial: FeedParserEntry[][] = [];
    const created: FeedParserEntry[][] = [];
    watcher.on(FeedWatcherEvents.INITIAL, (entries: FeedParserEntry[]) => {
      initial.push(entries);
    });
    watcher.on(FeedWatcherEvents.NEW, (entries: FeedParserEntry[]) => {
      created.push(entries);
    });

    try {
      await assert.rejects(() => watcher.start(), /404/);
      fail = false;
      await watcher.pollNow();
      assert.equal(initial.length, 1);
      assert.equal(initial[0][0].link, "https://example.com/first");
      assert.deepEqual(created, []);
    } finally {
      watcher.stop();
    }
  });

  it("lets a content show finish booting and load when the feed returns", async () => {
    let calls = 0;
    const show = new PollableShow("https://example.com/happy-hour", {
      attempts: 1,
      retryTime: 0,
      rssInterval: 60,
      searchOptions: { keys: ["link"] },
      fetch: () => {
        calls += 1;
        if (calls === 1) return Promise.reject(axios404());
        if (calls === 2) {
          return Promise.resolve([
            episode("2026-11-15T00:00:00Z", "https://example.com/first"),
          ]);
        }
        return Promise.resolve([
          episode("2026-11-16T00:00:00Z", "https://example.com/second"),
          episode("2026-11-15T00:00:00Z", "https://example.com/first"),
        ]);
      },
    });
    const created: { link?: string }[] = [];
    show.on(ContentListenerEvents.NEW, (episode: { link?: string }) => {
      created.push(episode);
    });

    try {
      await show.initialize();
      assert.equal(show.hasLoaded(), false);
      assert.equal(calls, 1);

      await show.pollNow();
      assert.equal(show.hasLoaded(), true);
      assert.equal(show.title, "Happy Hour");
      assert.equal(
        (show.fetchRecent() as { link?: string }).link,
        "https://example.com/first",
      );
      assert.deepEqual(created, []);

      await show.pollNow();
      assert.equal(created.length, 1);
      assert.equal(created[0].link, "https://example.com/second");
    } finally {
      show.stop();
    }
  });
});
