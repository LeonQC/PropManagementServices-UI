// Cross-entity search — GET /search/v1/all, the one endpoint that answers a search box
// rather than a service's own contract.
//
// Authenticated and enveloped, so authGet: the result set can contain deals, and the
// endpoint applies the stricter of the two entities' postures to the whole thing. There
// is no Postgres equivalent to fall back to — a query spanning properties and deals only
// exists in the index — so unlike getProperties/getDeals this simply fails when
// search-service is down, and the caller surfaces that.

import { authGet } from "./client";
import type { PaginatedResponse } from "./types";

export type SearchEntityType = "property" | "deal";

/** A lean common projection, not an entity: enough to rank, label and link a row.
 *  Follow entityType + id to that entity's own endpoint for the full record. */
export interface SearchHitResponse {
  entityType: SearchEntityType;
  id: string;
  title: string;
  /** The leading ~200 characters of the indexed body text. Plain text, no highlighting. */
  snippet: string | null;
  score: number;
}

/** `entityType` omitted returns both types interleaved by relevance. pageSize clamps 1..200. */
export function searchAll(
  q: string,
  entityType: SearchEntityType | null,
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<SearchHitResponse>> {
  const params = new URLSearchParams({
    q,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (entityType) params.set("entityType", entityType);

  return authGet(`/search/v1/all?${params}`, { signal });
}

/** Where a hit's detail page lives. The two entities are owned by different services, so
 *  this is the only place the mapping is written down. */
export function hitHref(hit: SearchHitResponse): string {
  return hit.entityType === "deal"
    ? `/acquisitions/${hit.id}`
    : `/listings/${encodeURIComponent(hit.id)}`;
}
