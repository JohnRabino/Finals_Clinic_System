export const API_BASE_URL = window.location.origin.includes("localhost:7036")
  ? `${window.location.origin}/api`
  : "https://localhost:7036/api";

export function showAlert(message, type = "error", containerId = "global-alert") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert ${type === "success" ? "alert-success" : "alert-error"}`;
  el.classList.remove("hidden");
  if (type === "success") setTimeout(() => el.classList.add("hidden"), 5000);
}

export function hideAlert(containerId = "global-alert") {
  const el = document.getElementById(containerId);
  if (el) el.classList.add("hidden");
}

export async function authFetch(endpoint, options = {}) {
  const token = localStorage.getItem("clinic_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    window.location.href = "index.html";
    throw new Error("Session expired. Please sign in again.");
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(data?.message || "Access Denied (403): Your role is not authorized for this action.");
    }
    const validationErrors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    throw new Error(data?.message || validationErrors || data?.title || `Request failed (${response.status})`);
  }

  return data;
}

export async function tryEndpoints(paths, options = {}) {
  let lastErr;
  for (const p of paths) {
    try {
      return await authFetch(p, options);
    } catch (err) {
      lastErr = err;
      if (!String(err.message).includes("404")) throw err;
    }
  }
  throw lastErr;
}
