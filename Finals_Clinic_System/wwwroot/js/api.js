// Match the port in your Properties/launchSettings.json (http://localhost:5001 or https://localhost:7xxx)
export const API_BASE_URL = "https://localhost:7036/api";

export function showAlert(message, type = "error", containerId = "global-alert") {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = message;
    el.className = `alert ${type === "success" ? "alert-success" : "alert-error"}`;
    el.classList.remove("hidden");
    if (type === "success") {
        setTimeout(() => el.classList.add("hidden"), 5000);
    }
}

export function hideAlert(containerId = "global-alert") {
    const el = document.getElementById(containerId);
    if (el) el.classList.add("hidden");
}

export async function authFetch(endpoint, options = {}) {
    const loader = document.getElementById("loading-bar");
    if (loader) loader.classList.remove("hidden");

    try {
        const token = localStorage.getItem("clinic_token");
        const headers = {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem("clinic_token");
            localStorage.removeItem("clinic_user");
            window.location.href = "index.html";
            return null;
        }

        if (response.status === 403) {
            throw new Error("Access forbidden: Your role is not authorized to perform this action.");
        }

        if (response.status === 204) return null;

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Handles your controllers' { message = "..." } as well as ASP.NET validation errors
            let errorMsg = payload.message || payload.error || payload.title || "Request failed.";
            if (payload.errors) {
                errorMsg = Object.values(payload.errors).flat().join(" ");
            }
            throw new Error(errorMsg);
        }

        return payload;
    } finally {
        if (loader) loader.classList.add("hidden");
    }
}