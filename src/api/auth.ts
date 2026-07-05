import { authGet, authPost, setAccessToken } from "./client";

// Mirrors the auth-service HTTP DTOs (AuthService.Api/DTOs/Responses.cs).
export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string | null;
}

interface TokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

// POST /auth/v1/login — sets the refresh cookie, returns the access token in the
// body. We stash the access token in memory and load the full profile from /me.
export async function login(email: string, password: string): Promise<UserProfile> {
  const tokens = await authPost<TokenResponse>(
    "/auth/v1/login",
    { email, password },
    { skipAuth: true } // a 401 here is bad credentials, not an expired session
  );
  setAccessToken(tokens.accessToken);
  return getMe();
}

// GET /auth/v1/me — the current user's profile.
export function getMe(): Promise<UserProfile> {
  return authGet<UserProfile>("/auth/v1/me");
}

// POST /auth/v1/logout — revokes the refresh token and clears the cookie.
export async function logout(): Promise<void> {
  try {
    await authPost<boolean>("/auth/v1/logout", {});
  } catch {
    // Best-effort: even if the server call fails, drop the local token below.
  }
  setAccessToken(null);
}
