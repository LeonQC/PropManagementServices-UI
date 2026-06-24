import { apiGet } from "./client";
import type { PaginatedResponse, PropertyResponse } from "./types";
import type { PropertyFilters } from "../lib/filters";

// GET /listings/v1/properties — paginated, newest first. Supports single-value
// propertyType/status/metroArea filters plus a minPrice/maxPrice range.
export function getProperties(
  page: number,
  pageSize: number,
  filters: PropertyFilters = {},
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

  return apiGet<PaginatedResponse<PropertyResponse>>(
    `/listings/v1/properties?${params.toString()}`,
    signal
  );
}
