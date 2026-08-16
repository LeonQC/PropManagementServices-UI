// ai-service API. Mirrors AiService.Api/DTOs — the service wraps payloads in the
// { data, meta } envelope, so everything goes through the auth* helpers.

import { authPost } from "./client";

/** One source the answer drew on. `sourceNumber` matches the [S1]-style markers in
 *  the answer text, so a sentence can be tied back to a page. */
export interface CitationResponse {
  sourceNumber: number;
  documentId: string;
  fileName: string | null;
  pageNo: number | null;
  /** Cosine similarity from the vector search. Roughly 0.15–0.55 in practice. */
  score: number;
  snippet: string;
}

export interface DealAnswerResponse {
  answer: string;
  citations: CitationResponse[];
  /** How many chunks were offered to the model, which may exceed the number cited. */
  retrievedChunkCount: number;
  /** False when the answer came back without a model call — the deal has no
   *  documents, or nothing cleared the relevance floor. The panel renders those as
   *  an empty state rather than as an answer. */
  answeredFromDocuments: boolean;
  model: string | null;
  latencyMs: number | null;
}

/**
 * Ask a question about one deal's documents (design doc §6.4).
 *
 * `dealId` is a path segment, not a body field — scope is server-controlled, and
 * sending it in the payload would have no effect.
 *
 * `documentId` narrows retrieval to a single file. Answers are grounded in the
 * deal's uploaded documents only; structured deal data arrives in Phase 2.
 */
export function askDeal(
  dealId: string,
  input: { question: string; documentId?: string },
  signal?: AbortSignal
): Promise<DealAnswerResponse> {
  return authPost<DealAnswerResponse>(
    `/ai/v1/deals/${encodeURIComponent(dealId)}/ask`,
    input,
    { signal }
  );
}
