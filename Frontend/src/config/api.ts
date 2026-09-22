const LIVE_API_URL = "https://church-management-sytem.onrender.com/api";

function normalizeApiUrl(value: string): string {
  const url = new URL(value.trim());
  const path = url.pathname.replace(/\/+$/, "");
  if (path && path !== "/api") {
    throw new Error("VITE_API_URL must be the backend origin or its /api URL.");
  }
  return `${url.origin}/api`;
}

/**
 * All frontend API requests use the deployed backend by default.
 * VITE_API_URL remains available for preview or staging deployments.
 */
export const API_URL = normalizeApiUrl(
  import.meta.env.VITE_API_URL || LIVE_API_URL,
);
