
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const formTitle = document.getElementById("formTitle");
const formDescription = document.getElementById("formDescription");
const message = document.getElementById("message");

function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
}

function switchForm(form) {
    message.textContent = "";

    if (form === "login") {
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        formTitle.textContent = "Welcome Back";
        formDescription.textContent = "Sign in to your account to continue.";
    } else {
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");

        loginTab.classList.remove("active");
        registerTab.classList.add("active");

        formTitle.textContent = "Create Account";
        formDescription.textContent = "Register your student account.";
    }
}

loginTab.addEventListener("click", function () {
    switchForm("login");
});

registerTab.addEventListener("click", function () {
    switchForm("register");
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = loginForm.querySelector("button");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    button.disabled = true;
    button.textContent = "Signing in...";

    try {
        const response = await fetch("/api/Auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed.");
        }

        const user = result.data;

        if (!user || !user.token) {
            throw new Error("Authentication token was not returned.");
        }

        localStorage.setItem("clinicToken", user.token);

        localStorage.setItem("clinicUser", JSON.stringify({
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        }));

        window.location.href = "/dashboard.html";

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        button.disabled = false;
        button.textContent = "Sign In";
    }
});

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const button = registerForm.querySelector("button");

    const fullName = document.getElementById("registerName").value.trim();
    const studentNumber = document.getElementById("registerStudentNumber").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    button.disabled = true;
    button.textContent = "Creating account...";

    try {
        const response = await fetch("/api/Auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName: fullName,
                studentNumber: studentNumber,
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Registration failed.");
        }

        registerForm.reset();
        switchForm("login");

        showMessage(
            result.message || "Account created successfully. You can now log in.",
            "success"
        );

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        button.disabled = false;
        button.textContent = "Create Account";
    }
});

const savedToken = localStorage.getItem("clinicToken");
const savedUser = localStorage.getItem("clinicUser");

if (savedToken && savedUser) {
    window.location.href = "/dashboard.html";
}
