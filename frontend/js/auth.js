import { API_BASE_URL, showAlert, hideAlert } from "./api.js";

// Redirect immediately if already logged in
if (localStorage.getItem("clinic_token")) {
    window.location.href = "dashboard.html";
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

function saveSessionAndRedirect(authData) {
    localStorage.setItem("clinic_token", authData.token);
    localStorage.setItem("clinic_user", JSON.stringify({
        userId: authData.userId,
        fullName: authData.fullName,
        email: authData.email,
        role: authData.role,
    }));
    window.location.href = "dashboard.html";
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("auth-alert");
    const btn = loginForm.querySelector("button[type='submit']");
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("login-email").value.trim(),
                password: document.getElementById("login-password").value,
            }),
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Invalid email or password.");

        // AuthController returns { message, data: AuthResponseDto }
        saveSessionAndRedirect(body.data);
    } catch (err) {
        showAlert(err.message, "error", "auth-alert");
    } finally {
        btn.disabled = false;
    }
});

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert("auth-alert");
    const btn = registerForm.querySelector("button[type='submit']");
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fullName: document.getElementById("reg-name").value.trim(),
                studentNumber: document.getElementById("reg-student-num").value.trim(),
                email: document.getElementById("reg-email").value.trim(),
                password: document.getElementById("reg-password").value,
            }),
        });

        const body = await res.json();
        if (!res.ok) {
            const msg = body.errors ? Object.values(body.errors).flat().join(" ") : (body.message || "Registration failed.");
            throw new Error(msg);
        }

        saveSessionAndRedirect(body.data);
    } catch (err) {
        showAlert(err.message, "error", "auth-alert");
    } finally {
        btn.disabled = false;
    }
});