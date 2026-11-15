import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { ContentListener } from "./ContentListener";
import { beginContentFeedLoad } from "./content-boot";

describe("content feed boot", () => {
  it("schedules a retry and tells boot that Discord can still connect", async () => {
    let retries = 0;
    await assert.rejects(
      beginContentFeedLoad(
        "ytFeedListener",
        async () => {
          throw new Error("Request failed with status code 404");
        },
        () => {
          retries += 1;
        },
      ),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /Discord will still connect/);
        assert.match(err.message, /404/);
        return true;
      },
    );
    assert.equal(retries, 1);
  });

  it("does not retry when the feed loads", async () => {
    let retries = 0;
    await beginContentFeedLoad("hhFeedListener", async () => undefined, () => {
      retries += 1;
    });
    assert.equal(retries, 0);
  });

  it("answers content commands with an empty list until the feed loads", () => {
    const listener = new ContentListener("https://example.com/feed", {});
    assert.equal(listener.hasLoaded(), false);
    assert.deepEqual(listener.search("happy hour"), []);
    assert.equal(listener.fetchRecent(), undefined);
  });
});
