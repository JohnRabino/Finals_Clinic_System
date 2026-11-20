const user = AngelicareApp.getUser();
const role = AngelicareApp.getRole();
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeDescription = document.getElementById("welcomeDescription");
const quickAccess = document.getElementById("quickAccess");

const roleContent = {
    student: {
        description: "Book clinic visits and review your own clinic information.",
        modules: [
            ["My Appointments", "Book, review, or cancel eligible appointments.", "/appointments.html"],
            ["My Profile", "View your student clinic profile.", "/workspace.html?module=profile"],
            ["Consultations", "Review your consultation history.", "/workspace.html?module=consultations"],
            ["Medical Records", "View diagnoses and treatments recorded by the clinic.", "/workspace.html?module=records"],
            ["Prescriptions", "View your medicine instructions.", "/workspace.html?module=prescriptions"],
            ["Referrals", "Track your external specialist referrals.", "/workspace.html?module=referrals"]
        ]
    },
    nurse: {
        description: "Manage patients, appointments, consultations, clinic records, and daily operations.",
        modules: [
            ["Appointments", "Review bookings and update appointment statuses.", "/appointments.html"],
            ["Patients", "Create, update, and deactivate patient profiles.", "/workspace.html?module=patients"],
            ["Consultations", "Record visits, assign doctors, and complete consultations.", "/workspace.html?module=consultations"],
            ["Medical Records", "Maintain diagnosis and treatment records.", "/workspace.html?module=records"],
            ["Prescriptions", "View and maintain prescriptions.", "/workspace.html?module=prescriptions"],
            ["Referrals", "Create referrals and record returned findings.", "/workspace.html?module=referrals"],
            ["Clinic Operations", "Manage time slots, external doctors, and walk-in logs.", "/workspace.html?module=operations"],
            ["Reports", "View patient history and daily schedules.", "/workspace.html?module=reports"]
        ]
    },
    doctor: {
        description: "Review consultations assigned to you, submit assessments, and issue prescriptions.",
        modules: [
            ["My Profile", "View your doctor profile.", "/workspace.html?module=profile"],
            ["Assigned Consultations", "Review assigned cases and submit your assessment.", "/workspace.html?module=consultations"],
            ["Prescriptions", "Issue prescriptions for eligible consultations.", "/workspace.html?module=prescriptions"]
        ]
    },
    admin: {
        description: "Manage staff accounts, doctor profiles, and clinic reports.",
        modules: [
            ["Staff Accounts", "Create Nurse and Doctor accounts and manage account status.", "/workspace.html?module=admin"],
            ["Reports", "View patient history and daily schedules.", "/workspace.html?module=reports"]
        ]
    }
};

const content = roleContent[role];
if (!content) {
    AngelicareApp.logout();
} else {
    welcomeTitle.textContent = `Welcome, ${user.fullName || "User"}!`;
    welcomeDescription.textContent = content.description;
    content.modules.forEach(module => {
        const link = document.createElement("a");
        link.href = module[2];
        link.className = "access-card";
        const title = document.createElement("h3");
        title.textContent = module[0];
        const description = document.createElement("p");
        description.textContent = module[1];
        link.append(title, description);
        quickAccess.appendChild(link);
    });
}
