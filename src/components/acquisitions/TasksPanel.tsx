import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDealTask, getDealTasks, updateDealTask, type TaskResponse } from "../../api/deals";
import { ACTIVE_SEQUENCE, stageMeta } from "../../lib/dealStages";
import { formatDate } from "../../lib/format";
import { useUserDirectory } from "../../lib/useUserDirectory";

interface Props {
  dealId: string;
}

// Checklist grouped by stage (design doc §5.3): template + custom tasks with
// assignee and due date; checking a box completes the task.
export default function TasksPanel({ dealId }: Props) {
  const queryClient = useQueryClient();
  const { users, nameOf } = useUserDirectory();
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: tasks } = useQuery({
    queryKey: ["deal", dealId, "tasks"],
    queryFn: ({ signal }) => getDealTasks(dealId, signal),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["deal", dealId, "tasks"] });
    // Board cards show task rollups — keep them in sync.
    void queryClient.invalidateQueries({ queryKey: ["deals"] });
  }

  const toggle = useMutation({
    mutationFn: (task: TaskResponse) =>
      updateDealTask(dealId, task.id, { status: task.status === "Done" ? "Open" : "Done" }),
    onSuccess: invalidate,
  });

  const add = useMutation({
    mutationFn: () =>
      createDealTask(dealId, {
        title,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      }),
    onSuccess: () => {
      setTitle("");
      setAssigneeId("");
      setDueDate("");
      invalidate();
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const byStage = new Map<string, TaskResponse[]>();
  for (const t of tasks ?? []) {
    if (!byStage.has(t.stage)) byStage.set(t.stage, []);
    byStage.get(t.stage)!.push(t);
  }
  // Stages in pipeline order, then anything unexpected at the end.
  const stages = [...ACTIVE_SEQUENCE.filter((s) => byStage.has(s)),
    ...[...byStage.keys()].filter((s) => !(ACTIVE_SEQUENCE as string[]).includes(s))];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tasks</h2>

      {stages.length === 0 && <p className="mt-3 text-sm text-slate-400">No tasks yet.</p>}

      {stages.map((stage) => (
        <div key={stage} className="mt-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${stageMeta(stage).dot}`} />
            {stageMeta(stage).label}
          </p>
          <ul className="mt-1 space-y-1">
            {byStage.get(stage)!.map((task) => {
              const overdue = task.status !== "Done" && task.dueDate !== null && task.dueDate < today;
              return (
                <li key={task.id} className="flex items-start gap-2 rounded-md px-1 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={task.status === "Done"}
                    onChange={() => toggle.mutate(task)}
                    className="mt-0.5 h-4 w-4 accent-brand"
                    aria-label={task.title}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${task.status === "Done" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {task.title}
                      {!task.isFromTemplate && (
                        <span className="ml-1.5 rounded bg-slate-100 px-1 text-[10px] font-medium text-slate-500">custom</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {task.assigneeId ? nameOf(task.assigneeId) : "Unassigned"}
                      {task.dueDate && (
                        <span className={overdue ? "ml-2 font-medium text-red-600" : "ml-2"}>
                          due {formatDate(task.dueDate)}
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <form
        className="mt-4 space-y-2 border-t border-slate-100 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) add.mutate();
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 focus:border-brand focus:outline-none"
            aria-label="Assignee"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName ?? u.id}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-600 focus:border-brand focus:outline-none"
            aria-label="Due date"
          />
          <button
            type="submit"
            disabled={!title.trim() || add.isPending}
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>
    </section>
  );
}
