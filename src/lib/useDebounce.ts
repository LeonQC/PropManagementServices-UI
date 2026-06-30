import { useEffect, useState } from "react";

// Returns a copy of `value` that only updates after it has stopped changing for
// `delay` ms. Used to keep the search box responsive while firing the API
// request once typing settles (instead of on every keystroke).
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    // Cleanup cancels the pending timer if `value` changes again first, so only
    // the final keystroke within the window actually commits.
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
