import { authGet, authPost } from "./client";

// documents-service (port 5400 behind the /documents/v1 proxy) owns file
// storage: presigned upload/download URLs and PDF text extraction. Responses
// use the { data, meta } envelope, so everything goes through the auth* helpers.
//
// Upload flow (architecture §2.4 — the BROWSER orchestrates, bytes never
// transit any API): upload-url → PUT to storage → confirm → link to the deal
// via the existing deals-service documents endpoint.

export interface UploadUrlResponse {
  documentId: string;
  storageKey: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface DocumentRecordResponse {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  dealId: string | null;
  documentType: string | null;
  uploadedById: string;
  createdAt: string;
  confirmedAt: string | null;
}

export interface DownloadUrlResponse {
  documentId: string;
  fileName: string;
  downloadUrl: string;
  expiresAt: string;
}

export function createUploadUrl(input: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<UploadUrlResponse> {
  return authPost("/documents/v1/upload-url", input);
}

export function confirmUpload(documentId: string): Promise<DocumentRecordResponse> {
  return authPost("/documents/v1/confirm", { documentId });
}

export function getDownloadUrl(documentId: string): Promise<DownloadUrlResponse> {
  return authGet(`/documents/v1/${documentId}/download-url`);
}

/** PUT the file straight to blob storage. The URL is presigned, so no bearer
 * header and no cookies — extra credentials would break the signature. The
 * Content-Type must match what was presigned. */
export async function putFileToStorage(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Storage upload failed: ${res.status} ${res.statusText}`);
  }
}

// The deals-service deal_documents record links back to our file record through
// this pointer in its storageUrl column (also how the Kafka consumer finds it).
const STORAGE_URL_PREFIX = "/documents/v1/";

export function storageUrlFor(documentId: string): string {
  return STORAGE_URL_PREFIX + documentId;
}

/** Extract the documents-service id from a deal document's storageUrl, or null
 * for legacy metadata-only records that never went through the upload flow. */
export function documentIdFromStorageUrl(storageUrl: string | null): string | null {
  if (!storageUrl || !storageUrl.startsWith(STORAGE_URL_PREFIX)) return null;
  const id = storageUrl.slice(STORAGE_URL_PREFIX.length);
  return id.length > 0 ? id : null;
}
