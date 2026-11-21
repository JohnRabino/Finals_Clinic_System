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

        const icons = {
            dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"></rect></svg>',
            calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"></rect><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16.5h3M14 13h2"></path></svg>',
            patients: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"></path><circle cx="10" cy="7.5" r="3.5"></circle><path d="M17 11a3.2 3.2 0 1 0-1-6.2M17 15h1a3 3 0 0 1 3 3v2"></path></svg>',
            consultation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-3.8-7-10V5l7-2 7 2v6c0 6.2-7 10-7 10Z"></path><path d="M9 12h6M12 9v6"></path></svg>',
            records: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 20V5a1.5 1.5 0 0 1 2-1.5Z"></path><path d="M14 3.5V8h4M8 12h8M8 16h8"></path></svg>',
            prescription: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 4.2a5 5 0 0 1 7.1 0l4.5 4.5a5 5 0 0 1-7.1 7.1l-4.5-4.5a5 5 0 0 1 0-7.1Z"></path><path d="m9 15 6-6M6 18l-2 2M13 5l6 6"></path></svg>',
            referral: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6"></path><path d="M5 5h5M5 19h5"></path></svg>',
            operations: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="m19.4 15 .1.1 1.1 1.9-1.8 1.8-1.9-1.1-.1-.1-1.5.6-.5 2.1h-2.6l-.5-2.1-1.5-.6-2 1.1-1.8-1.8 1.1-1.9-.6-1.5L3 13v-2.6l2.1-.5.6-1.5-1.1-2 1.8-1.8 2 1.1 1.5-.6.5-2.1H13l.5 2.1 1.5.6 1.9-1.1 1.8 1.8-1.1 2 .6 1.5 2.1.5V13l-2.1.5-.6 1.5Z"></path></svg>',
            reports: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V11M10 20V5M16 20v-8M22 20H2"></path></svg>',
            staff: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"></circle><path d="M3 20v-1.2A4.8 4.8 0 0 1 7.8 14h2.4a4.8 4.8 0 0 1 4.8 4.8V20M17 8h4M19 6v4"></path></svg>',
            profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path></svg>'
        };

        const sharedDashboard = {
            label: "Dashboard",
            url: "/dashboard.html",
            icon: "dashboard"
        };

        const roleGroups = {
            student: [
                { title: "Overview", links: [sharedDashboard] },
                {
                    title: "My Clinic",
                    links: [
                        { label: "My Appointments", url: "/appointments.html", icon: "calendar" },
                        { label: "My Profile", url: "/workspace.html?module=profile", icon: "profile" },
                        { label: "Consultations", url: "/workspace.html?module=consultations", icon: "consultation" },
                        { label: "Medical Records", url: "/workspace.html?module=records", icon: "records" },
                        { label: "Prescriptions", url: "/workspace.html?module=prescriptions", icon: "prescription" },
                        { label: "Referrals", url: "/workspace.html?module=referrals", icon: "referral" }
                    ]
                }
            ],
            nurse: [
                { title: "Overview", links: [sharedDashboard] },
                {
                    title: "Patient Care",
                    links: [
                        { label: "Appointments", url: "/appointments.html", icon: "calendar" },
                        { label: "Patients", url: "/workspace.html?module=patients", icon: "patients" },
                        { label: "Consultations", url: "/workspace.html?module=consultations", icon: "consultation" }
                    ]
                },
                {
                    title: "Clinical Records",
                    links: [
                        { label: "Medical Records", url: "/workspace.html?module=records", icon: "records" },
                        { label: "Prescriptions", url: "/workspace.html?module=prescriptions", icon: "prescription" },
                        { label: "Referrals", url: "/workspace.html?module=referrals", icon: "referral" }
                    ]
                },
                {
                    title: "Clinic Management",
                    links: [
                        { label: "Clinic Operations", url: "/workspace.html?module=operations", icon: "operations" },
                        { label: "Reports", url: "/workspace.html?module=reports", icon: "reports" }
                    ]
                }
            ],
            doctor: [
                { title: "Overview", links: [sharedDashboard] },
                {
                    title: "Clinical Work",
                    links: [
                        { label: "Assigned Consultations", url: "/workspace.html?module=consultations", icon: "consultation" },
                        { label: "Prescriptions", url: "/workspace.html?module=prescriptions", icon: "prescription" }
                    ]
                },
                {
                    title: "Account",
                    links: [
                        { label: "My Profile", url: "/workspace.html?module=profile", icon: "profile" }
                    ]
                }
            ],
            admin: [
                { title: "Overview", links: [sharedDashboard] },
                {
                    title: "Administration",
                    links: [
                        { label: "Staff Accounts", url: "/workspace.html?module=admin", icon: "staff" }
                    ]
                },
                {
                    title: "Insights",
                    links: [
                        { label: "Reports", url: "/workspace.html?module=reports", icon: "reports" }
                    ]
                }
            ]
        };

        const groups = roleGroups[role] || [];
        navigation.replaceChildren();

        const currentPath = window.location.pathname.toLowerCase();
        const currentModule = new URLSearchParams(window.location.search).get("module");

        groups.forEach(group => {
            const section = document.createElement("div");
            section.className = "nav-section";

            const heading = document.createElement("p");
            heading.className = "nav-section-label";
            heading.textContent = group.title;
            section.appendChild(heading);

            group.links.forEach(link => {
                const anchor = document.createElement("a");
                const target = new URL(link.url, window.location.origin);
                const targetModule = target.searchParams.get("module");
                const isActive = currentPath === target.pathname.toLowerCase()
                    && currentModule === targetModule;

                anchor.href = link.url;
                anchor.className = "nav-link";
                anchor.title = link.label;
                if (isActive) {
                    anchor.classList.add("active");
                    anchor.setAttribute("aria-current", "page");
                }

                const icon = document.createElement("span");
                icon.className = "nav-icon";
                icon.setAttribute("aria-hidden", "true");
                icon.innerHTML = icons[link.icon] || icons.dashboard;

                const label = document.createElement("span");
                label.className = "nav-link-label";
                label.textContent = link.label;

                anchor.append(icon, label);
                section.appendChild(anchor);
            });

            navigation.appendChild(section);
        });

        const sidebarUser = document.querySelector(".sidebar-user");
        const user = getUser();
        if (sidebarUser && !sidebarUser.querySelector(".sidebar-avatar")) {
            const initials = (user?.fullName || "U")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(part => part.charAt(0))
                .join("")
                .toUpperCase();
            const avatar = document.createElement("span");
            avatar.className = "sidebar-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = initials || "U";
            sidebarUser.prepend(avatar);
        }
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
