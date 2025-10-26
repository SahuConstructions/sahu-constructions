import { jwtDecode } from "jwt-decode";

// src/lib/auth.ts
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      email: payload.email,
      role: payload.role,
      userId: payload.sub,
      ...payload,
    };
  } catch (err) {
    console.error("Failed to decode token", err);
    return null;
  }
}
