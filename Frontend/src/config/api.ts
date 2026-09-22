const LIVE_API_URL = "https://church-management-sytem.onrender.com/api";

function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/**
 * All frontend API requests use the deployed backend by default.
 * VITE_API_URL remains available for preview or staging deployments.
 */
export const API_URL = normalizeApiUrl(
  import.meta.env.VITE_API_URL || LIVE_API_URL,
);
