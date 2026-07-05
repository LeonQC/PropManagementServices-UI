import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  refreshAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
} from "../api/client";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  type UserProfile,
} from "../api/auth";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: Status;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<UserProfile | null>(null);

  // On mount: try a silent refresh to restore the session (the access token is
  // gone after a reload, but the refresh cookie survives). Also register the
  // handler that fires when an in-flight refresh fails mid-session.
  useEffect(() => {
    let active = true;

    setUnauthorizedHandler(() => {
      setAccessToken(null);
      if (!active) return;
      setUser(null);
      setStatus("unauthenticated");
    });

    (async () => {
      const ok = await refreshAccessToken();
      if (!active) return;
      if (!ok) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const me = await getMe();
        if (!active) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (active) setStatus("unauthenticated");
      }
    })();

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const me = await apiLogin(email, password);
    setUser(me);
    setStatus("authenticated");
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setStatus("unauthenticated");
  };

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
