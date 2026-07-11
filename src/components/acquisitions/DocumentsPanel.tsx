import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDealDocument, getDealDocuments } from "../../api/deals";
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

// Document metadata records with per-document AI summary (design doc §5.3).
// Real file upload arrives with the documents-service; for now records point
// at externally-stored files.
export default function DocumentsPanel({ dealId }: Props) {
  const queryClient = useQueryClient();
  const { nameOf } = useUserDirectory();
  const [isAdding, setIsAdding] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState(DOC_TYPES[0]);

  const { data: documents } = useQuery({
    queryKey: ["deal", dealId, "documents"],
    queryFn: ({ signal }) => getDealDocuments(dealId, signal),
  });

  const add = useMutation({
    mutationFn: () => createDealDocument(dealId, { fileName, fileType }),
    onSuccess: () => {
      setFileName("");
      setIsAdding(false);
      void queryClient.invalidateQueries({ queryKey: ["deal", dealId, "documents"] });
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
            if (fileName.trim()) add.mutate();
          }}
        >
          <input
            autoFocus
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="File name, e.g. Rent Roll Q3.xlsx"
            className="block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
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
              disabled={!fileName.trim() || add.isPending}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <ul className="mt-3 space-y-2.5">
        {(documents ?? []).map((doc) => (
          <li key={doc.id} className="flex gap-2.5">
            <FileIcon />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700">{doc.fileName}</p>
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
        ))}
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
