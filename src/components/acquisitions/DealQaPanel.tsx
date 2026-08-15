import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { askDeal, type CitationResponse, type DealAnswerResponse } from "../../api/ai";
import { getDealDocuments } from "../../api/deals";
import { ApiError } from "../../api/client";

interface Props {
  dealId: string;
}

// Deal Q&A (design doc §6.4). A question goes to ai-service, which retrieves from
// this deal's uploaded documents, makes one Claude call, and returns an answer with
// page citations.
//
// Scope is documents only in this phase — structured deal data (financials, tasks,
// stage history) arrives with the assistant in Phase 2. The placeholder says so
// rather than letting people discover the gap by asking "is this deal on track?"
// and getting a refusal.
export default function DealQaPanel({ dealId }: Props) {
  const [question, setQuestion] = useState("");
  const [documentId, setDocumentId] = useState<string>("");
  const [asked, setAsked] = useState<string | null>(null);

  // Doubles as the empty-state check and the source of the "ask about one file"
  // filter. Shares a cache key with DocumentsPanel, so uploading there refreshes
  // this list too.
  const { data: documents } = useQuery({
    queryKey: ["deal", dealId, "documents"],
    queryFn: ({ signal }) => getDealDocuments(dealId, signal),
  });

  const ask = useMutation<DealAnswerResponse, Error, string>({
    mutationFn: (q) => askDeal(dealId, { question: q, documentId: documentId || undefined }),
  });

  const hasDocuments = (documents?.length ?? 0) > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || ask.isPending) return;
    setAsked(trimmed);
    ask.mutate(trimmed);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ask the documents</h2>

      {!hasDocuments ? (
        <p className="mt-3 text-sm text-slate-400">
          No documents on this deal yet. Upload one below and you'll be able to ask questions about it.
        </p>
      ) : (
        <>
          <form onSubmit={submit} className="mt-3 space-y-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter makes a newline — the questions are
                // usually one line, so requiring a click would be the odd choice.
                if (e.key === "Enter" && !e.shiftKey) submit(e);
              }}
              rows={2}
              maxLength={2000}
              placeholder="Ask about this deal's documents… e.g. what cap rate is this underwritten at?"
              className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />

            <div className="flex items-center gap-2">
              <select
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 focus:border-slate-400 focus:outline-none"
              >
                <option value="">All documents</option>
                {(documents ?? []).map((doc) => (
                  <option key={doc.id} value={documentIdOf(doc.storageUrl) ?? ""}>
                    {doc.fileName}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!question.trim() || ask.isPending}
                className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                {ask.isPending ? "Thinking…" : "Ask"}
              </button>
            </div>
          </form>

          {ask.isPending && (
            <p className="mt-3 text-sm text-slate-400">Searching this deal's documents…</p>
          )}

          {ask.isError && <ErrorNotice error={ask.error} />}

          {ask.isSuccess && !ask.isPending && (
            <Answer question={asked} result={ask.data} />
          )}
        </>
      )}
    </section>
  );
}

function Answer({ question, result }: { question: string | null; result: DealAnswerResponse }) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      {question && <p className="text-xs text-slate-400">{question}</p>}

      <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700">{result.answer}</p>

      {result.citations.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-400">Sources</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.citations.map((c) => (
              <CitationChip key={`${c.documentId}-${c.sourceNumber}`} citation={c} />
            ))}
          </div>
        </div>
      )}

      {/* Only meaningful when the model actually ran — the empty states report
          zero retrieved chunks, where a "0 excerpts" line would just be noise. */}
      {result.answeredFromDocuments && (
        <p className="mt-2 text-xs text-slate-300">
          {result.retrievedChunkCount} excerpt{result.retrievedChunkCount === 1 ? "" : "s"} searched
          {result.latencyMs != null && ` · ${(result.latencyMs / 1000).toFixed(1)}s`}
        </p>
      )}
    </div>
  );
}

// The chip shows the file and page a claim came from; the tooltip carries the
// actual quoted text, so a figure can be checked without leaving the page.
function CitationChip({ citation }: { citation: CitationResponse }) {
  const label = citation.fileName ?? "Document";
  return (
    <span
      title={citation.snippet}
      className="max-w-full truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
    >
      [S{citation.sourceNumber}] {label}
      {citation.pageNo != null && ` · p.${citation.pageNo}`}
    </span>
  );
}

// The three failures worth distinguishing: no key configured (503), retrieval down
// (502), and everything else. A generic "something went wrong" would leave the
// first one looking like a bug rather than a missing setting.
function ErrorNotice({ error }: { error: Error }) {
  const status = error instanceof ApiError ? error.status : 0;
  const message =
    status === 503
      ? "The assistant isn't available right now. If this is a fresh environment, ai-service may be missing its API key."
      : status === 502
        ? "Couldn't search this deal's documents. The document service may be down."
        : error instanceof ApiError && error.message
          ? error.message
          : "Something went wrong asking that question.";

  return (
    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
  );
}

// deal_documents stores a pointer (/documents/v1/{id}), not the documents-service
// id, and retrieval scopes by that id. Rows without a pointer were never uploaded
// through the storage flow, so nothing was ingested for them.
function documentIdOf(storageUrl: string | null): string | null {
  const prefix = "/documents/v1/";
  if (!storageUrl?.startsWith(prefix)) return null;
  return storageUrl.slice(prefix.length).replace(/\/$/, "") || null;
}
