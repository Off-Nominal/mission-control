import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { beginSeasonLoad, describeNdb2Failure } from "./boot";

describe("NDB2 season load", () => {
  it("describes the tuple logged for a non-JSON 503", () => {
    assert.equal(
      describeNdb2Failure([
        "We received a response from NDB2 but it doesn't look right.",
        "HTTP Status 503 from NDB2 API but response failed type predicate.",
      ]),
      "We received a response from NDB2 but it doesn't look right. — HTTP Status 503 from NDB2 API but response failed type predicate.",
    );
  });

  it("schedules a retry and reports a failure without hiding the detail", async () => {
    let retries = 0;
    await assert.rejects(
      beginSeasonLoad(
        async () => {
          throw [
            "We received a response from NDB2 but it doesn't look right.",
            "HTTP Status 503 from NDB2 API but response failed type predicate.",
          ];
        },
        () => {
          retries += 1;
        },
      ),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /Discord will still connect/);
        assert.match(err.message, /HTTP Status 503/);
        return true;
      },
    );
    assert.equal(retries, 1);
  });

  it("does not retry when the seasons load", async () => {
    let retries = 0;
    await beginSeasonLoad(async () => undefined, () => {
      retries += 1;
    });
    assert.equal(retries, 0);
  });
});
