
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

        if (!element) {
            return;
        }

        element.textContent = message;
        element.className = "feedback " + type;
    }

    function hideFeedback(elementId) {
        const element = document.getElementById(elementId);

        if (element) {
            element.textContent = "";
            element.className = "feedback";
        }
    }

    async function request(url, options = {}) {
        const token = localStorage.getItem("clinicToken");

        const headers = {
            ...options.headers
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        if (options.body && typeof options.body !== "string") {
            headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(options.body);
        }

        let response;

        try {
            response = await fetch(url, {
                ...options,
                headers
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
            const text = await response.text();

            if (text) {
                try {
                    result = JSON.parse(text);
                } catch {
                    result = { message: text };
                }
            }
        }

        if (!response.ok) {
            throw new Error(
                result?.message ||
                result?.error ||
                result?.title ||
                "The request could not be completed."
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
        const user = getUser();
        const role = getRole();
        const navigation = document.getElementById("sidebarNav");

        if (!navigation || !user) {
            return;
        }

        const links = [
            { label: "Dashboard", url: "/dashboard.html", roles: ["student", "nurse", "doctor", "admin"] },
            { label: "Appointments", url: "/appointments.html", roles: ["student", "nurse"] }
        ];

        navigation.innerHTML = "";

        links
            .filter(link => link.roles.includes(role))
            .forEach(link => {
                const anchor = document.createElement("a");
                anchor.href = link.url;
                anchor.textContent = link.label;
                anchor.className = "nav-link";

                if (window.location.pathname.toLowerCase() === link.url) {
                    anchor.classList.add("active");
                }

                navigation.appendChild(anchor);
            });
    }

    function initializeLayout() {
        if (!requireLogin()) {
            return;
        }

        const user = getUser();

        document.getElementById("sidebarName").textContent =
            user.fullName || "User";

        document.getElementById("sidebarRole").textContent =
            user.role || "User";

        document.getElementById("topbarName").textContent =
            user.fullName || "User";

        document.getElementById("topbarRole").textContent =
            user.role || "User";

        renderNavigation();

        document.getElementById("logoutButton")
            ?.addEventListener("click", logout);
    }

    return {
        getUser,
        getRole,
        getData,
        request,
        logout,
        requireLogin,
        initializeLayout,
        showFeedback,
        hideFeedback
    };
})();

AngelicareApp.initializeLayout();
