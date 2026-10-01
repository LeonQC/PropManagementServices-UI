# PropTrack UI

React client for **PropTrack**, an AI-powered deal management platform for commercial real estate acquisitions. The backend (seven microservices, RAG, and the LLM agent) lives in [PropManagementServices](https://github.com/zephaniezhu/PropManagementServices).

## Features

- **Listings:** browse, filter, and search properties; typo-tolerant keyword search through OpenSearch, with automatic fallback to Postgres full-text if search is down.
- **Acquisitions pipeline:** a stage-based deal board with deal health, AI scores and rationales, tasks, comments, financials, and history.
- **Documents:** direct-to-storage uploads using presigned S3/MinIO URLs.
- **Deal Q&A:** ask a question about one deal's documents and get an answer with page-level citations.
- **Deal Assistant:** a chat drawer for questions across the whole pipeline. Answers stream in over Server-Sent Events, and the agent's tool calls are shown as live progress steps.
- **Auth:** JWT access tokens with silent refresh, protected routes, and an admin user-management page.

## Stack

React 18, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS.

Streaming uses `fetch` with a `ReadableStream` reader, not `EventSource`, so assistant requests go through the same 401 → refresh → retry interceptor as every other API call.

## Running locally

Start the backend first (see the [backend README](https://github.com/zephaniezhu/PropManagementServices)), then:

```bash
npm install
npm run dev        # http://localhost:5173
```

In development, Vite proxies each API prefix (`/auth/v1`, `/listings/v1`, `/deals/v1`, `/search/v1`, …) to its service container, so there is no CORS setup. Sign in with the bootstrap admin configured in the backend's auth-service.

Optional: copy `.env.example` to `.env` to switch keyword search between OpenSearch (`search`, default) and Postgres full-text (`listings`).

```bash
npm run build      # type-check and production build
```

## Structure

```
src/
  api/         typed API clients, one per backend service
  auth/        auth context, token refresh, route guard
  pages/       Listings, Acquisitions, Deal detail, Property detail, Admin
  components/  listings, acquisitions, assistant, layout
  lib/         formatting, filters, deal stages and scoring helpers
```
