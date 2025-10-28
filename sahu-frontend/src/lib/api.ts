// src/lib/api.ts
import axios, { AxiosError } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Request Interceptor ---
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const message =
      (error.response?.data as any)?.message || error.message || "Unknown error";

    // Handle Unauthorized
    if (status === 401 && typeof window !== "undefined") {
      console.warn("⚠️ Session expired or invalid token. Redirecting to login.");
      localStorage.removeItem("token");
      window.location.href = "/";
      return Promise.reject({ ...error, handled: true });
    }

    // Handle Server Errors
    if (status && status >= 500) {
      console.error("💥 Server error:", message);
    }

    // Handle Network Errors
    if (error.code === "ECONNABORTED") {
      console.error("⏳ Request timeout - Please check your connection.");
    }

    return Promise.reject(error);
  }
);

export default api;
