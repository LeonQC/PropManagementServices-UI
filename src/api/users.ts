import { authDelete, authGet, authPost, authPut } from "./client";

// The fixed role set (mirrors AuthService.Models.Roles).
export const ROLES = [
  "Analyst",
  "Associate",
  "VP",
  "Principal",
  "Managing Director",
  "Admin",
] as const;

export type Role = (typeof ROLES)[number];

// Mirrors AuthService.Api/DTOs/Responses.cs UserResponse.
export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string | null;
  role: string;
}

// GET /auth/v1/users — list all users (Admin / Managing Director).
export function listUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  return authGet<AdminUser[]>("/auth/v1/users", { signal });
}

// POST /auth/v1/register — create a user (Admin only).
export function createUser(input: CreateUserInput): Promise<AdminUser> {
  return authPost<AdminUser>("/auth/v1/register", input);
}

// PUT /auth/v1/users/{id}/role — change a user's role (Admin only).
export function changeUserRole(id: string, role: string): Promise<AdminUser> {
  return authPut<AdminUser>(`/auth/v1/users/${id}/role`, { role });
}

// DELETE /auth/v1/users/{id} — deactivate a user, soft-delete (Admin only).
export function deleteUser(id: string): Promise<boolean> {
  return authDelete<boolean>(`/auth/v1/users/${id}`);
}
