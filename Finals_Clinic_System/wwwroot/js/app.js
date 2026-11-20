const API_BASE_URL = "/api";

const AngelicareApp = (() => {
    function getUser() {
        try {
            return JSON.parse(localStorage.getItem("clinicUser") || "null");
        } catch {
            return null;
        }
    }

    function getRole() {
        return (getUser()?.role || "").toLowerCase();
    }

    function getData(result) {
        return result && Object.prototype.hasOwnProperty.call(result, "data")
            ? result.data
            : result;
    }

    function showFeedback(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = message;
        element.className = `feedback ${type}`;
    }

    function hideFeedback(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = "";
        element.className = "feedback";
    }

    async function authFetch(path, options = {}) {
        const token = localStorage.getItem("clinicToken");
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        const headers = new Headers(options.headers || {});

        headers.set("Accept", "application/json");
        if (token) headers.set("Authorization", `Bearer ${token}`);

        let body = options.body;
        if (body !== undefined && body !== null && typeof body !== "string") {
            headers.set("Content-Type", "application/json");
            body = JSON.stringify(body);
        }

        let response;
        try {
            response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
                ...options,
                headers,
                body
            });
        } catch {
            throw new Error("Unable to connect to the server. Please try again.");
        }

        if (response.status === 401) {
            localStorage.removeItem("clinicToken");
            localStorage.removeItem("clinicUser");
            window.location.href = "/";
            throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
            throw new Error("You do not have permission to perform this action.");
        }

        let result = null;
        if (response.status !== 204) {
            const responseText = await response.text();
            if (responseText) {
                try {
                    result = JSON.parse(responseText);
                } catch {
                    result = { message: responseText };
                }
            }
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.detail ||
                result?.error ||
                result?.title ||
                `Request failed with status ${response.status}.`
            );
        }

        return result;
    }

    function logout() {
        localStorage.removeItem("clinicToken");
        localStorage.removeItem("clinicUser");
        window.location.href = "/";
    }

    function requireLogin() {
        const token = localStorage.getItem("clinicToken");
        const user = getUser();

        if (!token || !user) {
            window.location.href = "/";
            return false;
        }

        return true;
    }

    function renderNavigation() {
        const role = getRole();
        const navigation = document.getElementById("sidebarNav");
        if (!navigation) return;

        const links = [
            { label: "Dashboard", url: "/dashboard.html", roles: ["student", "nurse", "doctor", "admin"] },
            { label: "Appointments", url: "/appointments.html", roles: ["student", "nurse"] },
            { label: "My Profile", url: "/workspace.html?module=profile", roles: ["student", "doctor"] },
            { label: "Patients", url: "/workspace.html?module=patients", roles: ["nurse"] },
            { label: "Consultations", url: "/workspace.html?module=consultations", roles: ["student", "nurse", "doctor"] },
            { label: "Medical Records", url: "/workspace.html?module=records", roles: ["student", "nurse"] },
            { label: "Prescriptions", url: "/workspace.html?module=prescriptions", roles: ["student", "nurse", "doctor"] },
            { label: "Referrals", url: "/workspace.html?module=referrals", roles: ["student", "nurse"] },
            { label: "Clinic Operations", url: "/workspace.html?module=operations", roles: ["nurse"] },
            { label: "Reports", url: "/workspace.html?module=reports", roles: ["nurse", "admin"] },
            { label: "Staff Accounts", url: "/workspace.html?module=admin", roles: ["admin"] },
                   ];
        navigation.replaceChildren();
        links.filter(link => link.roles.includes(role)).forEach(link => {
            const anchor = document.createElement("a");
            anchor.href = link.url;
            anchor.textContent = link.label;
            anchor.className = "nav-link";

            if (window.location.pathname.toLowerCase() === link.url.split("?")[0] && (!link.url.includes("module=") || new URLSearchParams(window.location.search).get("module") === link.url.split("module=")[1])) {
                anchor.classList.add("active");
            }

            navigation.appendChild(anchor);
        });
    }

    function initializeLayout() {
        if (!requireLogin()) return;

        const user = getUser();
        const sidebarName = document.getElementById("sidebarName");
        const sidebarRole = document.getElementById("sidebarRole");
        const topbarName = document.getElementById("topbarName");
        const topbarRole = document.getElementById("topbarRole");

        if (sidebarName) sidebarName.textContent = user.fullName || "User";
        if (sidebarRole) sidebarRole.textContent = user.role || "User";
        if (topbarName) topbarName.textContent = user.fullName || "User";
        if (topbarRole) topbarRole.textContent = user.role || "User";

        renderNavigation();
        document.getElementById("logoutButton")?.addEventListener("click", logout);
    }

    return {
        getUser,
        getRole,
        getData,
        authFetch,
        logout,
        requireLogin,
        initializeLayout,
        showFeedback,
        hideFeedback
    };
})();

AngelicareApp.initializeLayout();
