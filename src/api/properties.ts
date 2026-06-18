import { apiGet } from "./client";
import type { PaginatedResponse, PropertyResponse } from "./types";

// GET /listings/v1/properties — paginated, newest first. The API also supports
// propertyType/status/metroArea/minPrice/maxPrice filters (not wired in the MVP).
export function getProperties(
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<PaginatedResponse<PropertyResponse>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiGet<PaginatedResponse<PropertyResponse>>(
    `/listings/v1/properties?${params.toString()}`,
    signal
  );
}
