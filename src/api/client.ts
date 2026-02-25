// src/api/client.ts
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE, // e.g. "https://api.mybigday.com"
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers!["Authorization"] = `Bearer ${token}`;
    // Attach required headers for your API
  const apiKey = import.meta.env.VITE_API_KEY;   // store in .env
  const author = import.meta.env.VITE_API_AUTHOR; // store in .env
  if (apiKey) cfg.headers!["apiKey"] = apiKey;
  if (author) cfg.headers!["author"] = author;
  return cfg;
});

export default client;
