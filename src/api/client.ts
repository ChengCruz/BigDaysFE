// src/api/client.ts
import axios from "axios";
import { tokenStore } from "../utils/tokenStore";
import { decodeJwt } from "../utils/jwtUtils";
import { AuthEndpoints } from "./endpoints";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // e.g. "https://api.mybigday.com"
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send HttpOnly cookies (refreshToken) cross-origin
});

// --- Request interceptor: attach access token + api keys ---
client.interceptors.request.use(cfg => {
  const token = tokenStore.get();
  if (token) {
    cfg.headers!["Authorization"] = `Bearer ${token}`;
    // Use the logged-in user's email as the author header
    const payload = decodeJwt(token);
    if (payload?.email) cfg.headers!["author"] = payload.email;
  }
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) cfg.headers!["apiKey"] = apiKey;
  // Fall back to env var author only when not logged in
  if (!cfg.headers!["author"]) {
    const envAuthor = import.meta.env.VITE_API_AUTHOR;
    if (envAuthor) cfg.headers!["author"] = envAuthor;
  }
  return cfg;
});

// --- Response interceptor: silent refresh on 401 ---
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  pendingQueue = [];
}

client.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config;

    // Only attempt refresh on 401, and not for the refresh/login endpoints themselves
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url === AuthEndpoints.refreshToken ||
      original.url === AuthEndpoints.login
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue requests that arrive while a refresh is already in flight
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers["Authorization"] = `Bearer ${token}`;
            resolve(client(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // No body needed — the HttpOnly cookie is sent automatically
      const { data } = await client.post(AuthEndpoints.refreshToken);

      const newToken = data.data?.accessToken ?? data.accessToken;
      tokenStore.set(newToken);

      processQueue(null, newToken);
      original.headers["Authorization"] = `Bearer ${newToken}`;
      return client(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStore.clear();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
