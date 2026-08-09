// Deals-service API. Mirrors DealsService.Api/DTOs — the service wraps payloads
// in the { data, meta } envelope, so everything goes through the auth* helpers.

import { ApiError, authGet, authPost, authPut } from "./client";
import type { PaginatedResponse } from "./types";

/** A deterministic health signal on a deal (design doc §6.6), computed server-side on
 *  every read — never stored. `riskFlags` stays reserved for the later AI judgment
 *  flags. See HEALTH_FLAG_LABELS in lib/dealHealth.ts for the known types. */
export interface HealthFlagResponse {
  type: string;
  severity: "warning" | "critical";
  message: string;
}

export interface DealResponse {
  id: string;
  name: string;
  propertyId: string;
  propertyName: string;
  propertyType: string | null;
  metroArea: string | null;
  /** Snapshotted from the property at deal creation. Fractions: 0.936 is 93.6%. */
  occupancyRate: number | null;
  marketCapRateBenchmark: number | null;
  stage: string;
  priority: string;
  ownerId: string;
  deadReason: string | null;
  offerPrice: number | null;
  projectedCapRate: number | null;
  targetIrr: number | null;
  equityMultiple: number | null;
  projectedCloseDate: string | null;
  aiScore: number | null;
  aiScoreRationale: string | null;
  riskFlags: string | null;
  stageEnteredAt: string;
  createdAt: string;
  updatedAt: string | null;
  taskCount: number;
  doneTaskCount: number;
  hasOverdueTasks: boolean;
  healthFlags: HealthFlagResponse[];
}

export interface StageHistoryResponse {
  id: string;
  fromStage: string | null;
  toStage: string;
  changedById: string;
  changedAt: string;
  daysInStage: number | null;
  reason: string | null;
}

export interface TaskResponse {
  id: string;
  dealId: string;
  title: string;
  stage: string;
  status: string;
  assigneeId: string | null;
  dueDate: string | null;
  isFromTemplate: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface CommentResponse {
  id: string;
  dealId: string;
  parentId: string | null;
  body: string;
  authorId: string;
  isAiGenerated: boolean;
  createdAt: string;
}

export interface DocumentResponse {
  id: string;
  dealId: string;
  fileName: string;
  fileType: string;
  storageUrl: string | null;
  aiSummary: string | null;
  uploadedById: string;
  uploadedAt: string;
}

export interface StageSummaryResponse {
  stage: string;
  count: number;
  totalValue: number;
}

export interface PipelineSummaryResponse {
  totalActiveDeals: number;
  totalPipelineValue: number;
  stages: StageSummaryResponse[];
}

export interface CreateDealInput {
  propertyId: string;
  propertyName: string;
  propertyType?: string | null;
  metroArea?: string | null;
  occupancyRate?: number | null;
  marketCapRateBenchmark?: number | null;
  name?: string | null;
  priority?: string | null;
  offerPrice?: number | null;
  projectedCapRate?: number | null;
  targetIrr?: number | null;
  equityMultiple?: number | null;
  projectedCloseDate?: string | null;
}

export interface UpdateDealInput {
  name?: string | null;
  priority?: string | null;
  offerPrice?: number | null;
  projectedCapRate?: number | null;
  targetIrr?: number | null;
  equityMultiple?: number | null;
  projectedCloseDate?: string | null;
}

/** Deal list filters — all optional, AND'd server-side. Dates are "yyyy-MM-dd";
 *  cap rates are fractions (0.065 = 6.5%). `q` is full-text — over the deal and property
 *  name on Postgres, also over comment bodies and document filenames on OpenSearch;
 *  `staleDays` the minimum days in the current stage. */
export interface DealFilters {
  stage?: string;
  ownerId?: string;
  priority?: string;
  propertyType?: string;
  metroArea?: string;
  closeDateBefore?: string;
  closeDateAfter?: string;
  offerPriceMin?: number;
  offerPriceMax?: number;
  capRateMin?: number;
  capRateMax?: number;
  hasOverdueTasks?: boolean;
  staleDays?: number;
  q?: string;
}

// Same routing rule the listings grid follows (see api/properties.ts):
//
//   no keyword  → /deals/v1     (Postgres). Browsing — filter and paginate — is plain
//                 relational work, so the board doesn't depend on the search stack.
//   keyword     → /search/v1    (OpenSearch). Typo tolerance, relevance ranking, and a
//                 corpus that reaches past the deal name into comment bodies and
//                 document filenames.
//
// The two differ from the properties pair in posture, not in shape: both deals
// endpoints require a bearer token and both return the { data, meta } envelope, so
// both go through authGet. Using apiGet here would hand back the envelope instead of
// the page — silently, with no error.
//
// The 16 query params, defaults and clamps are identical (diff-tested across filters
// and paging), so the switch is only a base path. Set VITE_SEARCH_API=listings to keep
// keyword search on Postgres too.
const KEYWORD_BACKEND = import.meta.env.VITE_SEARCH_API ?? "search";

export async function getDeals(
  page: number,
  pageSize: number,
  filters: DealFilters = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<DealResponse>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  // Skip null/undefined/"" but keep hasOverdueTasks=false, which is a real filter.
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const query = params.toString();

  if (filters.q?.trim() && KEYWORD_BACKEND === "search") {
    try {
      return await authGet(`/search/v1/deals?${query}`, { signal });
    } catch (err) {
      // Only fall back when search-service itself is the problem. An aborted request is
      // react-query cancelling a superseded keystroke, and a 4xx — a 401 included — is a
      // real client error that retrying against deals-service would only hide.
      const isServerFault = !(err instanceof ApiError) || err.status >= 500;
      if (signal?.aborted || !isServerFault) throw err;

      // Postgres has full-text search too, just a blunter one: the deals tsvector covers
      // only the deal name and its snapshotted property name, with no typo tolerance.
      console.warn(
        "[deals] search-service unavailable — falling back to Postgres full-text on " +
          "/deals/v1. Fewer matches, no typo tolerance, no relevance ranking.",
        err
      );
    }
  }

  return authGet(`/deals/v1/deals?${query}`, { signal });
}

export function getDeal(id: string, signal?: AbortSignal): Promise<DealResponse> {
  return authGet(`/deals/v1/deals/${id}`, { signal });
}

export function createDeal(input: CreateDealInput): Promise<DealResponse> {
  return authPost("/deals/v1/deals", input);
}

export function updateDeal(id: string, input: UpdateDealInput): Promise<DealResponse> {
  return authPut(`/deals/v1/deals/${id}`, input);
}

/** expectedCurrentStage guards against acting on a stale board (409 on mismatch). */
export function advanceDeal(id: string, expectedCurrentStage?: string): Promise<DealResponse> {
  return authPost(`/deals/v1/deals/${id}/advance`, { expectedCurrentStage });
}

export function killDeal(
  id: string,
  reason: string,
  expectedCurrentStage?: string
): Promise<DealResponse> {
  return authPost(`/deals/v1/deals/${id}/kill`, { reason, expectedCurrentStage });
}

/** Admin / Managing Director only (403 otherwise). */
export function transferDealOwner(id: string, newOwnerId: string): Promise<DealResponse> {
  return authPost(`/deals/v1/deals/${id}/transfer-owner`, { newOwnerId });
}

export function getDealHistory(id: string, signal?: AbortSignal): Promise<StageHistoryResponse[]> {
  return authGet(`/deals/v1/deals/${id}/history`, { signal });
}

export function getDealTasks(dealId: string, signal?: AbortSignal): Promise<TaskResponse[]> {
  return authGet(`/deals/v1/deals/${dealId}/tasks`, { signal });
}

export function createDealTask(
  dealId: string,
  input: { title: string; assigneeId?: string | null; dueDate?: string | null }
): Promise<TaskResponse> {
  return authPost(`/deals/v1/deals/${dealId}/tasks`, input);
}

export function updateDealTask(
  dealId: string,
  taskId: string,
  input: { title?: string; status?: string; assigneeId?: string | null; dueDate?: string | null }
): Promise<TaskResponse> {
  return authPut(`/deals/v1/deals/${dealId}/tasks/${taskId}`, input);
}

export function getDealComments(dealId: string, signal?: AbortSignal): Promise<CommentResponse[]> {
  return authGet(`/deals/v1/deals/${dealId}/comments`, { signal });
}

export function createDealComment(dealId: string, body: string): Promise<CommentResponse> {
  return authPost(`/deals/v1/deals/${dealId}/comments`, { body });
}

export function getDealDocuments(dealId: string, signal?: AbortSignal): Promise<DocumentResponse[]> {
  return authGet(`/deals/v1/deals/${dealId}/documents`, { signal });
}

export function createDealDocument(
  dealId: string,
  input: { fileName: string; fileType: string; storageUrl?: string | null }
): Promise<DocumentResponse> {
  return authPost(`/deals/v1/deals/${dealId}/documents`, input);
}

export function getPipelineSummary(signal?: AbortSignal): Promise<PipelineSummaryResponse> {
  return authGet("/deals/v1/pipeline/summary", { signal });
}
