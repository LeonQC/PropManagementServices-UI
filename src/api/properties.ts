import { apiGet } from "./client";
import type { PaginatedResponse, PropertyResponse } from "./types";
import { DEFAULT_SORT, type PropertyFilters } from "../lib/filters";

// GET /listings/v1/properties — paginated. Supports single-value
// propertyType/status/metroArea filters, a minPrice/maxPrice range, a `sort`
// (field+direction) and a `q` keyword search.
export function getProperties(
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
  if (q.trim()) params.set("q", q.trim());

  return apiGet<PaginatedResponse<PropertyResponse>>(
    `/listings/v1/properties?${params.toString()}`,
    signal
  );
}
