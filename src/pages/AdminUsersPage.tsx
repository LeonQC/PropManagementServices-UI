import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import {
  ROLES,
  changeUserRole,
  createUser,
  deleteUser,
  listUsers,
  type CreateUserInput,
} from "../api/users";
import { useAuth } from "../auth/AuthContext";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Create / change-role / delete are Admin-only on the backend; a Managing
  // Director can view the list but gets a read-only page.
  const isAdmin = user?.role === "Admin";
  const [showForm, setShowForm] = useState(false);

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: ({ signal }) => listUsers(signal),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => changeUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading ? "Loading…" : `${users.length} ${users.length === 1 ? "user" : "users"}`}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover"
          >
            <span className="text-base leading-none">+</span>
            Add User
          </button>
        )}
      </div>

      {showForm && <CreateUserForm onDone={() => setShowForm(false)} />}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isError ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Couldn't load users.{" "}
            <button className="font-medium text-brand-hover hover:underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === user?.id;
                const isPending = roleMutation.isPending && roleMutation.variables?.id === u.id;
                return (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {u.fullName ?? "—"}
                      {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <>
                          <select
                            value={u.role}
                            disabled={isSelf || isPending}
                            onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                            title={isSelf ? "You can't change your own role" : undefined}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {isPending && <span className="ml-2 text-xs text-slate-400">saving…</span>}
                        </>
                      ) : (
                        <span className="text-slate-700">{u.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && !isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Deactivate ${u.email}? They will no longer be able to sign in.`
                              )
                            ) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          disabled={deleteMutation.isPending && deleteMutation.variables === u.id}
                          className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline disabled:opacity-50"
                        >
                          {deleteMutation.isPending && deleteMutation.variables === u.id
                            ? "Removing…"
                            : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">No users.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {roleMutation.isError && (
        <p className="mt-3 text-sm text-rose-600">
          Couldn't change role: {errorText(roleMutation.error)}
        </p>
      )}
      {deleteMutation.isError && (
        <p className="mt-3 text-sm text-rose-600">
          Couldn't delete user: {errorText(deleteMutation.error)}
        </p>
      )}
    </div>
  );
}

const EMPTY: CreateUserInput = { email: "", password: "", fullName: "", role: "Analyst" };

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserInput>(EMPTY);

  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
  });

  const set = (key: keyof CreateUserInput) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName?.trim() ? form.fullName.trim() : null,
      role: form.role,
    });
  };

  const input =
    "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">New user</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Email <span className="text-rose-500">*</span></span>
          <input type="email" required autoComplete="off" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="user@proptrack.local" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Full name</span>
          <input type="text" value={form.fullName ?? ""} onChange={(e) => set("fullName")(e.target.value)} placeholder="Jane Analyst" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Password <span className="text-rose-500">*</span></span>
          <input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => set("password")(e.target.value)} placeholder="8+ chars, upper, lower, digit, symbol" className={input} />
          <span className="mt-1 block text-xs text-slate-400">
            At least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol.
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Role</span>
          <select value={form.role} onChange={(e) => set("role")(e.target.value)} className={input}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {mutation.isError && <ErrorBox error={mutation.error} />}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">
          {mutation.isPending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

// Prefer the API's message (e.g. "A user with that email already exists.") when present.
function errorText(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return err instanceof Error ? err.message : "Something went wrong.";
}

// Error banner that also lists the API's field-level details (e.g. the specific
// password rules that failed), which the top-line message alone doesn't convey.
function ErrorBox({ error }: { error: unknown }) {
  const details = error instanceof ApiError ? error.details ?? [] : [];
  return (
    <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      <p>{errorText(error)}</p>
      {details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {details.map((d, i) => (
            <li key={i}>{d.message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
