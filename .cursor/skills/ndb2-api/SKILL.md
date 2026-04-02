---
name: ndb2-api
description: >-
  Describes how mission-control integrates with the Off-Nominal NDB2 HTTP API and
  webhooks: V2 (preferred) vs legacy V1 paths, shared client, error shapes, and
  webhook routes. Use when adding or changing NDB2 calls, webhooks, predictions,
  bets, votes, scores, or migrating from V1 to V2.
---

# NDB2 API (mission-control)

NDB2 is the predictions backend. This repo calls it over HTTP and receives webhooks. **Prefer V2** for new work; V1 remains for endpoints not yet moved.

## Configuration

- `mcconfig.ndb2.baseUrl` — API origin (`NDB2_API_BASEURL`).
- `mcconfig.ndb2.clientId` — Bearer token for API and webhook auth (`NDB2_CLIENT_ID`).

All outbound calls use `Authorization: Bearer <clientId>`.

## Types package

Shared contracts live in **`@offnominal/ndb2-api-types`** (see `package.json` version).

- **V2:** import from `@offnominal/ndb2-api-types/v2` (e.g. `Entities`, `Endpoints`, `Webhooks`, `Utils`).
- **V1:** local types in `src/providers/ndb2-client/types.ts` under namespace `NDB2API` (and enums like `PredictionLifeCycle`).

## HTTP client

**`src/providers/ndb2-client/index.ts`** — class `Ndb2Client`, default export `ndb2Client` (constructed with `mcconfig.ndb2.clientId`, `initialize()` loads seasons from V2).

Path convention: `new URL(baseURL)` then `url.pathname = "api/v2/..."` or `"api/..."` (V1).

### V2 endpoints (use these when available)

| Method | Path | Client method | Notes |
|--------|------|---------------|--------|
| GET | `api/v2/seasons` | `getSeasons()` | Cached on client after `initialize()` |
| GET | `api/v2/predictions/:id` | `getPrediction(id)` | Returns `data` only |
| POST | `api/v2/predictions` | `addPrediction(body)` | Body type: `Endpoints.Predictions.POST_Predictions.Body` |
| PATCH | `api/v2/predictions/:id/retire` | `retirePrediction(id, discord_id)` | V2 retire |

Successful V2 JSON responses are unwrapped to **`res.data.data`** in the client. Errors use **`handleError`**: response shape `{ success, errors: [{ code, message }], data }`; thrown value is a **`[userMessage, detailMessage]`** tuple (same pattern as other providers).

### V1 endpoints (legacy; still in use)

Paths are under **`api/...`** (no `v2`). These methods use **`handleError_v1`**, which expects **`NDB2API.GeneralResponse`**: `{ success, errorCode, message, data }`.

Still routed through `Ndb2Client` today:

- `POST api/predictions/:id/bets` — `addBet`
- `POST api/predictions/:id/votes` — `addVote`
- `POST api/predictions/:id/snooze_checks/:snoozeCheckId` — `addSnoozeVote`
- `POST api/predictions/:id/trigger` — `triggerPrediction`
- `GET api/users/discord_id/:discord_id/scores` — `getScores`
- `GET api/predictions/search` — `searchPredictions` (`SearchOptions`, `SortByOption`)
- `GET api/scores` (with `view=points|predictions|bets`, optional season) — leaderboard helpers
- `PATCH api/predictions/:id/snooze` — `snoozePrediction`

When migrating a call from V1 to V2, switch the path, response unwrapping (`data` vs full body), error handler (`handleError` vs `handleError_v1`), and types to the V2 package.

### Example: creating a prediction (V2)

Service pattern: `src/services/ndb2/add-prediction/index.ts` builds `NDB2API.Endpoints.Predictions.POST_Predictions.Body` with `discord_id`, `text`, `date` (ISO string), `driver` (`"date"` | `"event"`), then `ndb2Client.addPrediction(body)`.

## Webhooks

Router: **`src/services/ndb2/webhooks/index.ts`**.

- **Auth:** `validateWebhookAuthorization` — `Authorization: Bearer` must match `mcconfig.ndb2.clientId`.
- **V1 route:** `POST .../ndb2` — body must pass `isNdb2WebhookEvent` (`src/services/ndb2/webhooks/v1/types.ts`). Several event names are **short-circuited as ignored** before `handleV1Webhook` (see router): e.g. `new_prediction`, `untriggered_prediction`, `unjudged_prediction`, `retired_prediction` on this path.
- **V2 route:** `POST .../ndb2/v2` — validate payload with **`API.Webhooks.isWebhookPayloadV2`** from `@offnominal/ndb2-api-types/v2`. Handler: `src/services/ndb2/webhooks/v2/index.ts` (e.g. `untriggered_prediction`, `unjudged_prediction`, `retired_prediction`).

Middleware responds early with JSON **`"thank u"`**; do not assume the handler must send the HTTP response.

## Where to look in the tree

- Client + V1/V2 split: `src/providers/ndb2-client/`
- Webhooks: `src/services/ndb2/webhooks/` (`v1/`, `v2/`, `middleware.ts`)
- Feature services: `src/services/ndb2/` (e.g. `add-prediction`, `retire-prediction`)

When the OpenAPI or `ndb2-api-types` package changes, update call sites and this skill if behavior or paths shift.
