import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDealComment, getDealComments } from "../../api/deals";
import { formatDate } from "../../lib/format";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  dealId: string;
}

// Activity feed distinguishing team and AI-generated entries (design doc §5.3).
export default function CommentsFeed({ dealId }: Props) {
  const queryClient = useQueryClient();
  const { nameOf, initialsOf } = useUserDirectory();
  const [body, setBody] = useState("");

  const { data: comments } = useQuery({
    queryKey: ["deal", dealId, "comments"],
    queryFn: ({ signal }) => getDealComments(dealId, signal),
  });

  const post = useMutation({
    mutationFn: () => createDealComment(dealId, body),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["deal", dealId, "comments"] });
    },
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Comments</h2>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) post.mutate();
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={!body.trim() || post.isPending}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          Post
        </button>
      </form>

      <ul className="mt-4 space-y-3">
        {(comments ?? []).map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <span
              className={[
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                c.isAiGenerated ? "bg-violet-100 text-violet-700" : "bg-header text-white",
              ].join(" ")}
            >
              {c.isAiGenerated ? "AI" : initialsOf(c.authorId)}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">
                <span className="font-medium text-slate-600">
                  {c.isAiGenerated ? "PropTrack AI" : nameOf(c.authorId)}
                </span>{" "}
                · {formatDate(c.createdAt)}
                {c.isAiGenerated && (
                  <span className="ml-1.5 rounded bg-violet-100 px-1 py-px text-[10px] font-medium text-violet-700">
                    AI generated
                  </span>
                )}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{c.body}</p>
            </div>
          </li>
        ))}
        {comments && comments.length === 0 && (
          <li className="text-sm text-slate-400">No comments yet.</li>
        )}
      </ul>
    </section>
  );
}
