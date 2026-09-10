"use client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const TOKEN_KEY = "sih26191_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "planner" | "viewer";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function authFetch(path: string, body: Record<string, unknown>): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as AuthResponse;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return authFetch("/api/auth/login", { email, password });
}

export function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return authFetch("/api/auth/register", { name, email, password });
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Session expired");
  }
  return res.json();
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
