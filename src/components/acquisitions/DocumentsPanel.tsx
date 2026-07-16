import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDealDocument, getDealDocuments } from "../../api/deals";
import {
  confirmUpload,
  createUploadUrl,
  documentIdFromStorageUrl,
  getDownloadUrl,
  putFileToStorage,
  storageUrlFor,
} from "../../api/documents";
import { formatDate } from "../../lib/format";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  dealId: string;
}

const DOC_TYPES = [
  "OfferingMemorandum",
  "RentRoll",
  "LetterOfIntent",
  "PhaseIReport",
  "Appraisal",
  "Insurance",
  "Other",
];

// Real file upload via documents-service (design doc §2.4). The browser
// orchestrates the whole flow — presigned upload-url → PUT to storage →
// confirm → link the record to the deal in deals-service.
export default function DocumentsPanel({ dealId }: Props) {
  const queryClient = useQueryClient();
  const { nameOf } = useUserDirectory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState(DOC_TYPES[0]);

  const { data: documents } = useQuery({
    queryKey: ["deal", dealId, "documents"],
    queryFn: ({ signal }) => getDealDocuments(dealId, signal),
  });

  const upload = useMutation({
    mutationFn: async (selected: File) => {
      const presigned = await createUploadUrl({
        fileName: selected.name,
        contentType: selected.type || "application/octet-stream",
        sizeBytes: selected.size,
      });
      await putFileToStorage(presigned.uploadUrl, selected);
      await confirmUpload(presigned.documentId);
      // Deals-service owns the deal↔document link (and publishes the
      // deal.document_uploaded event that triggers text extraction).
      return createDealDocument(dealId, {
        fileName: selected.name,
        fileType,
        storageUrl: storageUrlFor(presigned.documentId),
      });
    },
    onSuccess: () => {
      setFile(null);
      setIsAdding(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      void queryClient.invalidateQueries({ queryKey: ["deal", dealId, "documents"] });
    },
  });

  const download = useMutation({
    mutationFn: async (documentId: string) => {
      const { downloadUrl } = await getDownloadUrl(documentId);
      // Presigned URL, 15-min expiry — hand it to the browser as a plain
      // navigation; content-disposition makes it a file download.
      window.open(downloadUrl, "_blank", "noopener");
    },
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Documents</h2>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="text-sm font-medium text-brand hover:underline"
        >
          {isAdding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {isAdding && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (file && !upload.isPending) upload.mutate(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <div className="flex gap-2">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 focus:border-brand focus:outline-none"
            >
              {DOC_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!file || upload.isPending}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
            >
              {upload.isPending ? "Uploading…" : "Upload"}
            </button>
          </div>
          {upload.isError && (
            <p className="text-xs text-red-600">
              Upload failed: {upload.error instanceof Error ? upload.error.message : "unknown error"}
            </p>
          )}
        </form>
      )}

      <ul className="mt-3 space-y-2.5">
        {(documents ?? []).map((doc) => {
          const documentId = documentIdFromStorageUrl(doc.storageUrl);
          return (
            <li key={doc.id} className="flex gap-2.5">
              <FileIcon />
              <div className="min-w-0">
                {documentId ? (
                  <button
                    type="button"
                    onClick={() => download.mutate(documentId)}
                    className="block max-w-full truncate text-sm font-medium text-brand hover:underline"
                    title="Download"
                  >
                    {doc.fileName}
                  </button>
                ) : (
                  // Legacy metadata-only record — no file behind it.
                  <p className="truncate text-sm font-medium text-slate-700">{doc.fileName}</p>
                )}
                <p className="text-xs text-slate-400">
                  {doc.fileType} · {nameOf(doc.uploadedById)} · {formatDate(doc.uploadedAt)}
                </p>
                {doc.aiSummary && (
                  <p className="mt-1 rounded-md bg-violet-50 px-2 py-1 text-xs text-violet-800">
                    <span className="font-semibold">AI:</span> {doc.aiSummary}
                  </p>
                )}
              </div>
            </li>
          );
        })}
        {documents && documents.length === 0 && (
          <li className="text-sm text-slate-400">No documents yet.</li>
        )}
      </ul>
    </section>
  );
}

function FileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 shrink-0 text-slate-400"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
