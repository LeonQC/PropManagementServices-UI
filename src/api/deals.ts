// Deals-service API. Mirrors DealsService.Api/DTOs — the service wraps payloads
// in the { data, meta } envelope, so everything goes through the auth* helpers.

import { authGet, authPost, authPut } from "./client";
import type { PaginatedResponse } from "./types";

export interface DealResponse {
  id: string;
  name: string;
  propertyId: string;
  propertyName: string;
  propertyType: string | null;
  metroArea: string | null;
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
  ownerId?: string | null;
  offerPrice?: number | null;
  projectedCapRate?: number | null;
  targetIrr?: number | null;
  equityMultiple?: number | null;
  projectedCloseDate?: string | null;
}

export interface DealFilters {
  stage?: string;
  ownerId?: string;
  priority?: string;
}

export function getDeals(
  page: number,
  pageSize: number,
  filters: DealFilters = {},
  signal?: AbortSignal
): Promise<PaginatedResponse<DealResponse>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.ownerId) params.set("ownerId", filters.ownerId);
  if (filters.priority) params.set("priority", filters.priority);
  return authGet(`/deals/v1/deals?${params}`, { signal });
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
