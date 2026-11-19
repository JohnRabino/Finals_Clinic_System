
const user = AngelicareApp.getUser();
const role = AngelicareApp.getRole();

const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeDescription = document.getElementById("welcomeDescription");
const quickAccess = document.getElementById("quickAccess");

const roleContent = {
    student: {
        title: "Welcome, Student!",
        description: "View your clinic appointments and access your personal clinic information.",
        modules: [
            {
                title: "My Appointments",
                description: "View your scheduled appointments and book an available clinic time slot.",
                url: "/appointments.html"
            }
        ]
    },
    nurse: {
        title: "Welcome, Nurse!",
        description: "Manage clinic appointments and assist with daily clinic operations.",
        modules: [
            {
                title: "Appointments",
                description: "Review appointments, confirm bookings, and update appointment status.",
                url: "/appointments.html"
            }
        ]
    },
    doctor: {
        title: "Welcome, Doctor!",
        description: "Access your clinic workspace for assigned consultations and clinical assessments.",
        modules: []
    },
    admin: {
        title: "Welcome, Administrator!",
        description: "Manage clinic system accounts and monitor system operations.",
        modules: []
    }
};

const content = roleContent[role];

if (!content) {
    AngelicareApp.logout();
} else {
    welcomeTitle.textContent = `Welcome, ${user.fullName || "User"}!`;
    welcomeDescription.textContent = content.description;

    if (content.modules.length === 0) {
        const message = document.createElement("div");
        message.className = "content-card";
        message.textContent = "Additional modules for this role will be added in the next development batch.";
        quickAccess.appendChild(message);
    } else {
        content.modules.forEach(module => {
            const link = document.createElement("a");
            link.href = module.url;
            link.className = "access-card";

            const title = document.createElement("h3");
            title.textContent = module.title;

            const description = document.createElement("p");
            description.textContent = module.description;

            link.appendChild(title);
            link.appendChild(description);

            quickAccess.appendChild(link);
        });
    }
}
