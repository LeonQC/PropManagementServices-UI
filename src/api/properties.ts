import { ApiError, apiGet, apiPost } from "./client";
import type {
  CreatePropertyRequest,
  PaginatedResponse,
  PropertyResponse,
} from "./types";
import { DEFAULT_SORT, type PropertyFilters } from "../lib/filters";

// The grid is served by whichever backend suits the request:
//
//   no keyword  → /listings/v1  (Postgres). Browsing — filter, sort, paginate — is
//                 plain relational work that Postgres does well, so the default view
//                 doesn't depend on the search stack being up.
//   keyword     → /search/v1    (OpenSearch). Full-text is what OpenSearch is here
//                 for: typo tolerance, prefix matching, relevance ranking, and
//                 cross-entity search later.
//
// Both endpoints take the same query params and return the same shape (diff-tested
// across filters, sorts, and pagination), so switching between them is only a base
// path — totals and ordering stay consistent.
//
// Set VITE_SEARCH_API=listings to keep keyword search on Postgres too, e.g. when
// running without the OpenSearch stack.
const KEYWORD_BACKEND = import.meta.env.VITE_SEARCH_API ?? "search";

// GET /{listings|search}/v1/properties — paginated. Supports single-value
// propertyType/status/metroArea filters, a minPrice/maxPrice range, a `sort`
// (field+direction) and a `q` keyword search.
export async function getProperties(
  page: number,
  pageSize: number,
  filters: PropertyFilters = {},
  sort: string = DEFAULT_SORT,
  q: string = "",
  signal?: AbortSignal
): Promise<PaginatedResponse<PropertyResponse>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.status) params.set("status", filters.status);
  if (filters.metroArea) params.set("metroArea", filters.metroArea);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  // "newest" is the server default — omit it to keep request URLs clean.
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  const keyword = q.trim();
  if (keyword) params.set("q", keyword);

  const query = params.toString();

  if (keyword && KEYWORD_BACKEND === "search") {
    try {
      return await apiGet<PaginatedResponse<PropertyResponse>>(
        `/search/v1/properties?${query}`,
        signal
      );
    } catch (err) {
      // Only fall back when search-service itself is the problem. An aborted request
      // is react-query cancelling a superseded keystroke, and a 4xx is a real client
      // error — retrying either against listings would hide a genuine bug.
      const isServerFault = !(err instanceof ApiError) || err.status >= 500;
      if (signal?.aborted || !isServerFault) throw err;

      // Postgres still has full-text search, just a blunter one — the query stays
      // valid, it only loses typo tolerance and relevance ranking.
      console.warn(
        "[properties] search-service unavailable — falling back to Postgres full-text " +
          "on /listings/v1. Results lose typo tolerance and relevance ranking.",
        err
      );
    }
  }

  return apiGet<PaginatedResponse<PropertyResponse>>(
    `/listings/v1/properties?${query}`,
    signal
  );
}

// GET /listings/v1/properties/{id} — a single property (404s when not found).
export function getProperty(
  id: string,
  signal?: AbortSignal
): Promise<PropertyResponse> {
  return apiGet<PropertyResponse>(
    `/listings/v1/properties/${encodeURIComponent(id)}`,
    signal
  );
}

// POST /listings/v1/properties — creates a property, returns the created record.
export function createProperty(
  input: CreatePropertyRequest,
  signal?: AbortSignal
): Promise<PropertyResponse> {
  return apiPost<PropertyResponse>("/listings/v1/properties", input, signal);
}
