# ADR-005 — Use Valkey Pub/Sub for MusicBrainz Fetch Orchestration and Long-TTL MBID Cache in MongoDB

## Context

Tracklist metadata is fetched from MusicBrainz when an `mbid` is provided or updated. The HTTP call adds latency and can be rate limited or fail intermittently. MBIDs are globally unique and the associated tracklists rarely change.

We already run Valkey and have an event-driven pattern in the application layer. We want to:

- Decouple the MusicBrainz fetch from request/response flows via Pub/Sub.
- Cache tracklists by MBID in MongoDB with a longer TTL and consult this cache first.

## Decision

Adopt Valkey Pub/Sub for background fetch orchestration and introduce a MongoDB MBID cache with a long TTL.

- Publish a fetch request when an MBID is present and cache is cold.
- Subscribe to fetch requests in a background worker; read from Mongo cache first and only hit MusicBrainz on cache miss.
- Write results to the Mongo cache and emit a result event.
- Controllers/use cases consume the result event or poll the cache depending on the interaction pattern.

## Architecture

- Topics:

  - `metadata.mbid.fetch.request` — command to fetch tracklist for MBID
  - `metadata.mbid.fetch.result` — successful fetch outcome
  - `metadata.mbid.fetch.failed` — failures for monitoring / retry

- Producers:

  - Record create/update use cases publish `fetch.request` when MBID is present and tracklist missing

- Consumers:
  - Background subscriber reads `fetch.request` and executes:
    1. Lookup MBID cache in Mongo
    2. If hit and not expired, publish `fetch.result`
    3. If miss, call MusicBrainz, upsert cache, publish `fetch.result`
    4. On error, publish `fetch.failed`

## MongoDB MBID Cache

- Collection: `mbid_tracklists`
- Document shape:
  - `mbid: string` (unique)
  - `tracklist: string[]`
  - `fetchedAt: Date`
  - `expiresAt: Date` (TTL index)
- Indexes:
  - Unique on `mbid`
  - TTL index on `expiresAt`
- Behavior:
  - On fetch request, query cache first
  - On miss, fetch from MusicBrainz and upsert cache with new `expiresAt`

## Implementation Sketch

- Pub/Sub client

  - Add a Valkey client for robust Pub/Sub
  - Configure publisher and subscriber singletons in Nest

- Publishing from use cases

  - Instead of directly calling `MusicMetadataService` in the happy path, publish to `metadata.mbid.fetch.request` with payload `{ mbid }`
  - For synchronous flows that require tracklist immediately, continue to call `MusicMetadataService` but also write through to the cache for future requests

- Subscriber

  - Subscribe to `metadata.mbid.fetch.request`
  - Read Mongo cache; if stale/missing, call `MusicBrainzService.fetchTracklistByMbid(mbid)`
  - Upsert cache and publish `metadata.mbid.fetch.result`

- Cache lookup first strategy
  - Update `MusicMetadataService` implementation to consult Mongo cache first, then fallback to HTTP

## Error Handling

- Pub/Sub delivery failures: log and retry with backoff; do not surface errors to clients
- MusicBrainz errors: return empty list and publish `fetch.failed` for observability
- Cache unavailable: proceed without cache; fall back to HTTP fetch

## TTL Strategy

- Mongo cache TTL: long (30–90 days) given MBID immutability and rare tracklist changes
- Optional soft-refresh: if near expiry, refresh in background while serving cached data

## Consequences — Positive

- Reduces request latency and isolates external dependency failures
- Reuses Valkey already provisioned for caching
- Improves stability by consulting Mongo cache first

## Consequences — Negative

- Adds background worker and Pub/Sub operational complexity
- Requires cache collection management and TTL index creation
- Potential eventual consistency; tracklist might update slightly later than write operations

## Alternatives Considered

- Inline HTTP fetch only
  - Simpler but higher latency and less resilient
- Cache in Valkey instead of Mongo
  - Fast but volatile; prefer persistent cache given long TTL and rare changes

## Rollout Plan

1. Create `mbid_tracklists` collection with unique index on `mbid` and TTL on `expiresAt`
2. Add Valkey Pub/Sub client providers (publisher/subscriber)
3. Publish fetch requests from create/update flows; subscribe and process in background
4. Update `MusicBrainzService` to consult Mongo cache before HTTP
5. Add metrics/logging on `fetch.failed` and cache hit/miss ratios
