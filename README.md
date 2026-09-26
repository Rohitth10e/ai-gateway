# AI Gateway

AI Gateway is an LLM proxy and observability platform built around Spring Boot, Redis, and a Next.js administration dashboard. It reduces repeated LLM costs and latency by checking a semantic cache before forwarding requests to an external provider.

## Project overview

The system is organized into four primary areas:

| Area | Responsibility |
| --- | --- |
| **Spring Boot gateway** | Exposes a `/v1/chat/completions`-style REST endpoint, authenticates API keys, applies per-key rate limits, coordinates cache lookup and writes, proxies LLM requests, and exposes usage metrics. |
| **Redis** | Stores semantic cache entries, rate-limiting state, and usage counters using data structures appropriate to each workload. |
| **AI integration** | Creates prompt embeddings for semantic matching and proxies the actual completion request to an OpenAI- or Anthropic-compatible provider. |
| **Next.js + shadcn dashboard** | Provides an administrator-facing view of cache hit rate, cost savings, latency percentiles, and per-key usage through Spring Boot REST APIs. |

## Request flow

```text
Client
  |
  v
Spring Boot /v1/chat/completions
  |
  +--> Validate API key
  |
  +--> Apply per-key rate limit
  |
  +--> Normalize prompt and create embedding
  |
  +--> Search Redis semantic cache
          |
          +--> Cache hit: record usage and return cached response
          |
          +--> Cache miss:
                  |
                  +--> Call configured LLM provider
                  |
                  +--> Store embedding and response in Redis
                  |
                  +--> Record usage, latency, tokens, and cost
                  |
                  +--> Return provider response
```

## Delegated task hierarchy

Work is divided by responsibility so each agent can make changes within a clear boundary while the gateway owner coordinates cross-cutting integration.

```text
Project owner
|
+-- Backend / infrastructure owner
|   +-- Spring Boot gateway
|   +-- API keys and authentication
|   +-- LLM provider integration
|   +-- Redis schemas and data access
|   +-- Rate limiting
|   +-- Usage tracking and metrics APIs
|   +-- Docker and deployment
|
+-- Frontend developer agent
|   +-- Next.js application structure
|   +-- shadcn/ui components
|   +-- Tailwind styling implementation
|   +-- Dashboard API client and data loading
|   +-- Dashboard behavior and frontend tests
|
+-- Gateway dashboard UX agent
    +-- Dashboard information architecture
    +-- User flows and navigation
    +-- Visual hierarchy and responsive layouts
    +-- Chart, table, metric-card, and empty-state UX
    +-- Accessibility and interaction recommendations
```

### Ownership rules

- Assign **frontend implementation** issues to the frontend developer agent.
- Assign **dashboard UI/UX and visual design** issues to the gateway dashboard UX agent.
- Keep issues involving **Spring Boot, Docker, Redis, LLM providers, API contracts, authentication, rate limiting, caching logic, metrics, and deployment** with the project owner.
- When an issue crosses boundaries, the implementation owner remains responsible for integration and requests design or API input from the relevant agent.
- Agents should keep changes scoped to their area and document any schema, endpoint, or UX contract they introduce.

## Spring Boot gateway

Spring Boot is the core gateway service. It exposes an OpenAI-compatible chat completion endpoint and owns the request lifecycle:

1. Authenticate the incoming API key.
2. Enforce the API key's rate limit.
3. Normalize the prompt and generate an embedding.
4. Search the semantic cache.
5. Return a cached response when the similarity threshold is met.
6. Call the configured LLM provider on a cache miss.
7. Store the provider response and embedding.
8. Record usage, token counts, latency, cost, and cache hit/miss data.

The gateway should keep provider-specific details behind a small client abstraction so OpenAI and Anthropic-compatible providers can be configured without changing the public API.

## Redis responsibilities

Redis deliberately supports three distinct workloads:

### Semantic cache

Store prompt embeddings alongside the generated response and metadata such as model, provider, token count, creation time, and expiration. Redis Stack can provide vector search through RediSearch. A simpler v1 implementation may use exact-match or fuzzy-hash buckets before introducing vector similarity.

### Rate limiting

Use sorted sets, `INCR` plus `TTL`, or a token-bucket representation to enforce sliding-window limits per API key. The implementation should define whether limits apply to requests, tokens, or both, and should return a `429 Too Many Requests` response with `Retry-After` when a limit is exceeded.

### Usage tracking

Maintain per-key, per-day counters for:

- Requests
- Cache hits and misses
- Input and output tokens
- Estimated provider cost
- Estimated cost saved through cache hits
- Latency measurements or percentile inputs

## AI integration

The AI layer has two separate responsibilities:

1. **Embeddings:** Generate a compact vector representation of the normalized prompt for semantic cache lookup.
2. **Completions:** Forward cache misses to the configured LLM provider and return the provider response in the gateway's compatible response format.

The similarity threshold is a meaningful design decision. A threshold that is too low can return incorrect cached answers; a threshold that is too high reduces the cache hit rate and cost savings. The chosen value should be configurable, measured, and justified with hit-rate and correctness data.

## Semantic cache decision

Spring Boot does not provide a first-class vector-search Redis client comparable to the Python ecosystem. Before implementing the cache schema, choose one of these approaches:

### v1: exact or fuzzy matching

- Normalize the prompt.
- Generate a deterministic exact key or fuzzy hash.
- Store and retrieve responses with ordinary Redis commands.
- Keep the schema simple and easy to operate.

This is the fastest route to a working gateway and creates a baseline for measuring cache effectiveness.

### v2: vector similarity

- Generate embeddings for prompts.
- Store vectors and metadata in Redis Stack.
- Query RediSearch vector indexes through Jedis, Lettuce, or a dedicated Redis command integration.
- Apply a configurable similarity threshold before accepting a cached response.

This provides better semantic reuse but requires deliberate index configuration, client support, and operational testing.

The selected approach changes the Redis schema, cache lookup code, observability requirements, and test strategy. Make this decision before finalizing the cache implementation.

## Admin dashboard

The Next.js and shadcn dashboard consumes Spring Boot REST endpoints and should provide:

- Cache hit rate over time
- Requests, cache hits, and cache misses
- Estimated cost saved
- Latency percentiles
- Token usage
- Per-API-key usage and rate-limit status
- Provider and model breakdowns
- Clear loading, empty, error, and stale-data states

The frontend developer agent owns implementation. The gateway dashboard UX agent owns information architecture, visual hierarchy, responsive behavior, accessibility, and interaction design.

## Technology stack

- **Backend:** Java, Spring Boot, Maven
- **Frontend:** Next.js, React, TypeScript
- **UI:** shadcn/ui, Tailwind CSS
- **Cache and counters:** Redis / Redis Stack
- **AI providers:** OpenAI- or Anthropic-compatible APIs
- **Local orchestration:** Docker Compose

## Local development

### Backend

```bash
cd backend/server
./mvnw spring-boot:run
```

On Windows:

```powershell
cd backend\server
.\mvnw.cmd spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard is available at `http://localhost:3000` by default.

### Validation

```bash
cd frontend
npm run lint
npm run build
```

## Configuration and secrets

Keep provider keys, Redis credentials, and local overrides in environment files that are not committed. Commit only safe templates such as `.env.example`. Never place real API keys in source code, issue comments, screenshots, or Docker images.

## Repository conventions

- Keep backend and infrastructure changes separate from frontend presentation changes where practical.
- Preserve API contracts between Spring Boot and the dashboard.
- Add tests for cache hit/miss behavior, rate-limit edge cases, provider failures, and metrics aggregation.
- Prefer observable behavior: log request identifiers and outcomes without logging prompts, API keys, or provider secrets.
- Keep Docker Compose files, Dockerfiles, source code, configuration templates, and package lockfiles tracked.
