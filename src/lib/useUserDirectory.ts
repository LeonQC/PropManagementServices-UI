import { useQuery } from "@tanstack/react-query";
import { getUserDirectory } from "../api/users";

/**
 * The auth-service user directory as a lookup helper. Cached aggressively —
 * team rosters change rarely — and shared by every component that renders an
 * owner/assignee/author name.
 */
export function useUserDirectory() {
  const { data } = useQuery({
    queryKey: ["user-directory"],
    queryFn: ({ signal }) => getUserDirectory(signal),
    staleTime: 5 * 60 * 1000,
  });

  const byId = new Map((data ?? []).map((u) => [u.id, u.fullName]));

  const nameOf = (id: string | null | undefined): string => {
    if (!id) return "Unassigned";
    return byId.get(id) ?? "Unknown user";
  };

  /** "Dana Ortiz" -> "DO" for avatar chips. */
  const initialsOf = (id: string | null | undefined): string => {
    const name = id ? byId.get(id) : null;
    if (!name) return "?";
    return name
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return { users: data ?? [], nameOf, initialsOf };
}
