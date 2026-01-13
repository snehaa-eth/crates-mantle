import axios from "axios";
const BASE_URL = process.env.NEXT_PUBLIC_NODE_ENV === "production" ? process.env.NEXT_PUBLIC_BACKEND_BASE_URL : "https://crates-mantle.vercel.app/api/v1";
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

export { api };