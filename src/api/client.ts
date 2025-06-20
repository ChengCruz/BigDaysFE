// src/api/client.ts
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // e.g. "https://api.mybigday.com"
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers!["Authorization"] = `Bearer ${token}`;
  return cfg;
});

export default client;
