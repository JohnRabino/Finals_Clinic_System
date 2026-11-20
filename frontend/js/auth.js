import { API_BASE_URL, showAlert, hideAlert } from "./api.js";

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function extractToken(payload) {
  if (!payload) return null;
  if (typeof payload === "string" && payload.split(".").length === 3) return payload;
  if (typeof payload !== "object") return null;

  const direct =
    payload.token ||
    payload.Token ||
    payload.jwtToken ||
    payload.JwtToken ||
    payload.jwt ||
    payload.Jwt ||
    payload.accessToken ||
    payload.AccessToken ||
    payload.access_token;
  if (typeof direct === "string" && direct.split(".").length === 3) return direct;

  for (const val of Object.values(payload)) {
    if (typeof val === "string" && val.startsWith("eyJ") && val.split(".").length === 3) {
      return val;
    }
    if (val && typeof val === "object") {
      const nested = extractToken(val);
      if (nested) return nested;
    }
  }
  return null;
}

const existingToken = localStorage.getItem("clinic_token");
const existingUser = JSON.parse(localStorage.getItem("clinic_user") || "null");
if (existingToken && existingUser?.role) {
  window.location.href = "dashboard.html";
} else {
  localStorage.removeItem("clinic_token");
  localStorage.removeItem("clinic_user");
}

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

tabLogin.addEventListener("click", () => {
  hideAlert("auth-alert");
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
});

tabRegister.addEventListener("click", () => {
  hideAlert("auth-alert");
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
});

async function readResponseBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("auth-alert");
  const btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Signing in...";

  try {
    const emailInput = document.getElementById("login-email").value.trim();
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput,
        password: document.getElementById("login-password").value,
      }),
    });

    const data = await readResponseBody(res);
    if (!res.ok) {
      const errs = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
      const msg = typeof data === "string" ? data : (data?.message || errs);
      throw new Error(msg || `Sign-in failed (HTTP ${res.status})`);
    }

    const token = extractToken(data);
    if (!token) {
      throw new Error(`Unexpected login response: ${JSON.stringify(data)}`);
    }

    const claims = parseJwt(token);
    const u = (typeof data === "object" && (data.user || data.User || data.data)) || data || {};
    const rawRole =
      u.role ||
      u.Role ||
      claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      claims.role ||
      "";
    const role = rawRole ? rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase() : "";

    const fullName =
      u.fullName ||
      u.FullName ||
      u.name ||
      claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      claims.unique_name ||
      emailInput;

    const userId =
      u.userId ||
      u.UserId ||
      claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      claims.sub ||
      null;

    localStorage.setItem("clinic_token", token);
    localStorage.setItem("clinic_user", JSON.stringify({ userId, fullName, email: emailInput, role }));
    window.location.href = "dashboard.html";
  } catch (err) {
    showAlert(err.message, "error", "auth-alert");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign In to ClinicCare";
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert("auth-alert");
  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Creating account...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: document.getElementById("reg-name").value.trim(),
        studentNumber: document.getElementById("reg-student-number").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value,
      }),
    });

    const data = await readResponseBody(res);
    if (!res.ok) {
      const errs = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
      const msg = typeof data === "string" ? data : (data?.message || errs);
      throw new Error(msg || `Registration failed (HTTP ${res.status})`);
    }

    showAlert("Student account created! You can now sign in.", "success", "auth-alert");
    registerForm.reset();
    tabLogin.click();
  } catch (err) {
    showAlert(err.message, "error", "auth-alert");
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Student Account";
  }
});
